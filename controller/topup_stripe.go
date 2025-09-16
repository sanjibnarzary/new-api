package controller

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"one-api/common"
	"one-api/model"
	"one-api/setting"
	"one-api/setting/operation_setting"
	"one-api/setting/system_setting"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stripe/stripe-go/v81"
	"github.com/stripe/stripe-go/v81/checkout/session"
	"github.com/stripe/stripe-go/v81/webhook"
	"github.com/thanhpk/randstr"
)

const (
	PaymentMethodStripe = "stripe"
)

var stripeAdaptor = &StripeAdaptor{}

type StripePayRequest struct {
	Amount        int64  `json:"amount"`
	PaymentMethod string `json:"payment_method"`
}

type StripeAdaptor struct {
}

func (*StripeAdaptor) RequestAmount(c *gin.Context, req *StripePayRequest) {
       if req.Amount < getStripeMinTopup() {
	       c.JSON(200, gin.H{"message": "error", "data": fmt.Sprintf("Top-up amount cannot be less than %d", getStripeMinTopup())})
	       return
       }
	id := c.GetInt("id")
	group, err := model.GetUserGroup(id, true)
       if err != nil {
	       c.JSON(200, gin.H{"message": "error", "data": "Failed to get user group"})
	       return
       }
	payMoney := getStripePayMoney(float64(req.Amount), group)
       if payMoney <= 0.01 {
	       c.JSON(200, gin.H{"message": "error", "data": "Top-up amount too low"})
	       return
       }
	c.JSON(200, gin.H{"message": "success", "data": strconv.FormatFloat(payMoney, 'f', 2, 64)})
}

func (*StripeAdaptor) RequestPay(c *gin.Context, req *StripePayRequest) {
       if req.PaymentMethod != PaymentMethodStripe {
	       c.JSON(200, gin.H{"message": "error", "data": "Unsupported payment method"})
	       return
       }
       if req.Amount < getStripeMinTopup() {
	       c.JSON(200, gin.H{"message": fmt.Sprintf("Top-up amount cannot be less than %d", getStripeMinTopup()), "data": 10})
	       return
       }
       if req.Amount > 10000 {
	       c.JSON(200, gin.H{"message": "Top-up amount cannot be greater than 10000", "data": 10})
	       return
       }

       id := c.GetInt("id")
       user, _ := model.GetUserById(id, false)
       // Check required normalized profile fields
       missingFields := []string{}
       if user.FullName == "" {
	       missingFields = append(missingFields, "full_name")
       }
       if user.AddressLine1 == "" {
	       missingFields = append(missingFields, "address_line1")
       }
       if user.AddressPostalCode == "" {
	       missingFields = append(missingFields, "address_postal_code")
       }
       if user.AddressCity == "" {
	       missingFields = append(missingFields, "address_city")
       }
       if user.AddressState == "" {
	       missingFields = append(missingFields, "address_state")
       }
       if user.CountryCode == "" {
	       missingFields = append(missingFields, "country_code")
       }
       if user.Phone == "" {
	       missingFields = append(missingFields, "phone")
       }
	   if user.Email == "" {
	       missingFields = append(missingFields, "email")
	   }

       if len(missingFields) > 0 {
	       c.JSON(200, gin.H{
		       "message": "profile_incomplete",
		       "data": gin.H{
			       "redirect": "/setting/personal",
			       "missing_fields": missingFields,
		       },
	       })
		   //redirect to profile completion page
		   c.Redirect(302, "/console/personal")
	       return
       }
       chargedMoney := GetChargedAmount(float64(req.Amount), *user)

       reference := fmt.Sprintf("new-api-ref-%d-%d-%s", user.Id, time.Now().UnixMilli(), randstr.String(4))
       referenceId := "ref_" + common.Sha1([]byte(reference))

       // Pass normalized profile fields to Stripe
       payLink, err := genStripeLinkWithProfile(
	       referenceId,
	       user.StripeCustomer,
	       user.Email,
	       req.Amount,
	       user.FullName,
	       user.AddressLine1,
	       user.AddressPostalCode,
	       user.AddressCity,
	       user.AddressState,
	       user.CountryCode,
	       user.Phone,
       )
       if err != nil {
	       log.Println("Failed to get Stripe Checkout payment link", err)
	       c.JSON(200, gin.H{"message": "error", "data": "Failed to initiate payment" + err.Error()})
	       return
       }

       topUp := &model.TopUp{
	       UserId:     id,
	       Amount:     req.Amount,
	       Money:      chargedMoney,
	       TradeNo:    referenceId,
	       CreateTime: time.Now().Unix(),
	       Status:     common.TopUpStatusPending,
       }
       err = topUp.Insert()
       if err != nil {
	       c.JSON(200, gin.H{"message": "error", "data": "Failed to create order"})
	       return
       }
       c.JSON(200, gin.H{
	       "message": "success",
	       "data": gin.H{
		       "pay_link": payLink,
	       },
       })
}

func RequestStripeAmount(c *gin.Context) {
	var req StripePayRequest
       err := c.ShouldBindJSON(&req)
       if err != nil {
	       c.JSON(200, gin.H{"message": "error", "data": "Invalid parameters"})
	       return
       }
	stripeAdaptor.RequestAmount(c, &req)
}

func RequestStripePay(c *gin.Context) {
	var req StripePayRequest
       err := c.ShouldBindJSON(&req)
       if err != nil {
	       c.JSON(200, gin.H{"message": "error", "data": "Invalid parameters"})
	       return
       }
	stripeAdaptor.RequestPay(c, &req)
}

func StripeWebhook(c *gin.Context) {
	payload, err := io.ReadAll(c.Request.Body)
       if err != nil {
	       log.Printf("Failed to parse Stripe Webhook payload: %v\n", err)
	       c.AbortWithStatus(http.StatusServiceUnavailable)
	       return
       }

	signature := c.GetHeader("Stripe-Signature")
	endpointSecret := setting.StripeWebhookSecret
	event, err := webhook.ConstructEventWithOptions(payload, signature, endpointSecret, webhook.ConstructEventOptions{
		IgnoreAPIVersionMismatch: true,
	})

       if err != nil {
	       log.Printf("Stripe Webhook signature verification failed: %v\n", err)
	       c.AbortWithStatus(http.StatusBadRequest)
	       return
       }

       switch event.Type {
       case stripe.EventTypeCheckoutSessionCompleted:
	       sessionCompleted(event)
       case stripe.EventTypeCheckoutSessionExpired:
	       sessionExpired(event)
       default:
	       log.Printf("Unsupported Stripe Webhook event type: %s\n", event.Type)
       }

	c.Status(http.StatusOK)
}

func sessionCompleted(event stripe.Event) {
	customerId := event.GetObjectValue("customer")
	referenceId := event.GetObjectValue("client_reference_id")
	status := event.GetObjectValue("status")
       if "complete" != status {
	       log.Println("Incorrect Stripe Checkout completion status:", status, ",", referenceId)
	       return
       }

       err := model.Recharge(referenceId, customerId)
       if err != nil {
	       log.Println(err.Error(), referenceId)
	       return
       }

	total, _ := strconv.ParseFloat(event.GetObjectValue("amount_total"), 64)
	currency := strings.ToUpper(event.GetObjectValue("currency"))
	log.Printf("Payment received: %s, %.2f(%s)", referenceId, total/100, currency)
}

func sessionExpired(event stripe.Event) {
	referenceId := event.GetObjectValue("client_reference_id")
	status := event.GetObjectValue("status")
       if "expired" != status {
	       log.Println("Incorrect Stripe Checkout expired status:", status, ",", referenceId)
	       return
       }

       if len(referenceId) == 0 {
	       log.Println("No payment reference provided")
	       return
       }

       topUp := model.GetTopUpByTradeNo(referenceId)
       if topUp == nil {
	       log.Println("Top-up order does not exist", referenceId)
	       return
       }

       if topUp.Status != common.TopUpStatusPending {
	       log.Println("Top-up order status incorrect", referenceId)
       }

       topUp.Status = common.TopUpStatusExpired
       err := topUp.Update()
       if err != nil {
	       log.Println("Failed to expire top-up order", referenceId, ", err:", err.Error())
	       return
       }

       log.Println("Top-up order expired", referenceId)
}

// Pass profile fields as metadata to Stripe
func genStripeLinkWithProfile(
       referenceId string,
       customerId string,
       email string,
       amount int64,
       fullName string,
       addressLine1 string,
       addressPostalCode string,
       addressCity string,
       addressState string,
       countryCode string,
       phone string,
) (string, error) {
       if !strings.HasPrefix(setting.StripeApiSecret, "sk_") && !strings.HasPrefix(setting.StripeApiSecret, "rk_") {
	       return "", fmt.Errorf("无效的Stripe API密钥")
       }

       stripe.Key = setting.StripeApiSecret

	   params := &stripe.CheckoutSessionParams{
		   ClientReferenceID: stripe.String(referenceId),
		   SuccessURL:        stripe.String(system_setting.ServerAddress + "/console/log"),
		   CancelURL:         stripe.String(system_setting.ServerAddress + "/console/topup"),
		   LineItems: []*stripe.CheckoutSessionLineItemParams{
			   {
				   Price:    stripe.String(setting.StripePriceId),
				   Quantity: stripe.Int64(amount),
			   },
		   },
		   Mode: stripe.String(string(stripe.CheckoutSessionModePayment)),
		   ShippingAddressCollection: &stripe.CheckoutSessionShippingAddressCollectionParams{
			   AllowedCountries: stripe.StringSlice([]string{
				   "AC", "AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AQ", "AR", "AT", "AU", "AW", "AX", "AZ",
				   "BA", "BB", "BD", "BE", "BF", "BG", "BH", "BI", "BJ", "BL", "BM", "BN", "BO", "BQ", "BR", "BS", "BT", "BV", "BW", "BY", "BZ",
				   "CA", "CD", "CF", "CG", "CH", "CI", "CK", "CL", "CM", "CN", "CO", "CR", "CV", "CW", "CY", "CZ",
				   "DE", "DJ", "DK", "DM", "DO", "DZ",
				   "EC", "EE", "EG", "EH", "ER", "ES", "ET",
				   "FI", "FJ", "FK", "FO", "FR",
				   "GA", "GB", "GD", "GE", "GF", "GG", "GH", "GI", "GL", "GM", "GN", "GP", "GQ", "GR", "GS", "GT", "GU", "GW", "GY",
				   "HK", "HN", "HR", "HT", "HU",
				   "ID", "IE", "IL", "IM", "IN", "IO", "IQ", "IS", "IT",
				   "JE", "JM", "JO", "JP",
				   "KE", "KG", "KH", "KI", "KM", "KN", "KR", "KW", "KY", "KZ",
				   "LA", "LB", "LC", "LI", "LK", "LR", "LS", "LT", "LU", "LV", "LY",
				   "MA", "MC", "MD", "ME", "MF", "MG", "MK", "ML", "MM", "MN", "MO", "MQ", "MR", "MS", "MT", "MU", "MV", "MW", "MX", "MY", "MZ",
				   "NA", "NC", "NE", "NG", "NI", "NL", "NO", "NP", "NR", "NU", "NZ",
				   "OM",
				   "PA", "PE", "PF", "PG", "PH", "PK", "PL", "PM", "PN", "PR", "PS", "PT", "PY",
				   "QA",
				   "RE", "RO", "RS", "RU", "RW",
				   "SA", "SB", "SC", "SD", "SE", "SG", "SH", "SI", "SJ", "SK", "SL", "SM", "SN", "SO", "SR", "SS", "ST", "SV", "SX", "SZ",
				   "TA", "TC", "TD", "TF", "TG", "TH", "TJ", "TK", "TL", "TM", "TN", "TO", "TR", "TT", "TV", "TW", "TZ",
				   "UA", "UG", "US", "UY", "UZ",
				   "VA", "VC", "VE", "VG", "VN", "VU",
				   "WF", "WS",
				   "XK",
				   "YE", "YT",
				   "ZA", "ZM", "ZW",
			   }),
		   },
		   BillingAddressCollection: stripe.String(string(stripe.CheckoutSessionBillingAddressCollectionRequired)),
		   CustomFields: []*stripe.CheckoutSessionCustomFieldParams{
			   {
				   Key: stripe.String("customer_phone"),
				   Label: &stripe.CheckoutSessionCustomFieldLabelParams{
					   Type:  stripe.String(string(stripe.CheckoutSessionCustomFieldLabelTypeCustom)),
					   Custom: stripe.String("Phone Number"),
				   },
				   Type:     stripe.String(string(stripe.CheckoutSessionCustomFieldTypeText)),
				   Optional: stripe.Bool(false),
			   },
		   },
		   Metadata: map[string]string{},
	   }

       


		if customerId != "" {
			params.Customer = stripe.String(customerId)
		} else {
			params.CustomerCreation = stripe.String(string(stripe.CheckoutSessionCustomerCreationAlways))
			params.CustomerEmail = stripe.String(email)
		}
     

       result, err := session.New(params)
       if err != nil {
	       return "", err
       }

       return result.URL, nil
}

func GetChargedAmount(count float64, user model.User) float64 {
	topUpGroupRatio := common.GetTopupGroupRatio(user.Group)
	if topUpGroupRatio == 0 {
		topUpGroupRatio = 1
	}

	return count * topUpGroupRatio
}

func getStripePayMoney(amount float64, group string) float64 {
	originalAmount := amount
	if !common.DisplayInCurrencyEnabled {
		amount = amount / common.QuotaPerUnit
	}
	// Using float64 for monetary calculations is acceptable here due to the small amounts involved
	topupGroupRatio := common.GetTopupGroupRatio(group)
	if topupGroupRatio == 0 {
		topupGroupRatio = 1
	}
	// apply optional preset discount by the original request amount (if configured), default 1.0
	discount := 1.0
	if ds, ok := operation_setting.GetPaymentSetting().AmountDiscount[int(originalAmount)]; ok {
		if ds > 0 {
			discount = ds
		}
	}
	payMoney := amount * setting.StripeUnitPrice * topupGroupRatio * discount
	return payMoney
}

func getStripeMinTopup() int64 {
	minTopup := setting.StripeMinTopUp
	if !common.DisplayInCurrencyEnabled {
		minTopup = minTopup * int(common.QuotaPerUnit)
	}
	return int64(minTopup)
}
