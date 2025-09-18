package controller

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"one-api/common"
	"one-api/model"
	"one-api/setting"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	razorpay "github.com/razorpay/razorpay-go"
	"gorm.io/gorm"
)

const (
	PaymentMethodRazorpay = "razorpay"
)

var razorpayAdaptor = &RazorpayAdaptor{}

type RazorpayPayRequest struct {
	Amount        int64  `json:"amount"`
	PaymentMethod string `json:"payment_method"`
}

type RazorpayAdaptor struct {
}

// Public key exposure for frontend (do not expose secret)
func GetRazorpayPublicKey(c *gin.Context) {
	keyID := setting.RazorpayKeyId
	if keyID == "" { // fallback env
		keyID = os.Getenv("RAZORPAY_KEY_ID")
	}
	if keyID == "" {
		c.JSON(200, gin.H{"message": "error", "data": "Razorpay key not configured"})
		return
	}
	c.JSON(200, gin.H{"message": "success", "data": gin.H{"key_id": keyID}})
}

func (*RazorpayAdaptor) RequestAmount(c *gin.Context, req *RazorpayPayRequest) {
	if req.Amount < 100 {
		c.JSON(200, gin.H{"message": "error", "data": "Top-up amount cannot be less than 100"})
		return
	}
	// id := c.GetInt("id")
	payMoney := float64(req.Amount)
	if payMoney <= 0.01 {
		c.JSON(200, gin.H{"message": "error", "data": "Top-up amount too low"})
		return
	}
	c.JSON(200, gin.H{"message": "success", "data": strconv.FormatFloat(payMoney, 'f', 2, 64)})
}

func (*RazorpayAdaptor) RequestPay(c *gin.Context, req *RazorpayPayRequest) {
	if req.PaymentMethod != PaymentMethodRazorpay {
		c.JSON(200, gin.H{"message": "error", "data": "Unsupported payment method"})
		return
	}
	if req.Amount < 100 {
		c.JSON(200, gin.H{"message": "error", "data": "Top-up amount cannot be less than 100"})
		return
	}
	if req.Amount > 1000000 {
		c.JSON(200, gin.H{"message": "error", "data": "Top-up amount cannot be greater than 1000000"})
		return
	}

	id := c.GetInt("id")
	chargedMoney := float64(req.Amount)

	referenceId := "ref_" + strconv.FormatInt(time.Now().UnixNano(), 10)

	keyID := setting.RazorpayKeyId
	if keyID == "" {
		keyID = os.Getenv("RAZORPAY_KEY_ID")
	}
	keySecret := setting.RazorpayKeySecret
	if keySecret == "" {
		keySecret = os.Getenv("RAZORPAY_KEY_SECRET")
	}
	if keyID == "" || keySecret == "" {
		c.JSON(200, gin.H{"message": "error", "data": "Razorpay keys not configured"})
		return
	}
	client := razorpay.NewClient(keyID, keySecret)
	data := map[string]interface{}{
		"amount":   req.Amount, // Amount in paise
		"currency": "INR",
		"receipt":  referenceId,
	}

	body, err := client.Order.Create(data, nil)
	if err != nil {
		log.Printf("Error creating Razorpay order: %v", err)
		c.JSON(200, gin.H{"message": "error", "data": "Failed to create order"})
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
		"data":    body,
	})
}

func RequestRazorpayAmount(c *gin.Context) {
	var req RazorpayPayRequest
	err := c.ShouldBindJSON(&req)
	if err != nil {
		c.JSON(200, gin.H{"message": "error", "data": "Invalid parameters"})
		return
	}
	razorpayAdaptor.RequestAmount(c, &req)
}

func RequestRazorpayPay(c *gin.Context) {
	var req RazorpayPayRequest
	err := c.ShouldBindJSON(&req)
	if err != nil {
		c.JSON(200, gin.H{"message": "error", "data": "Invalid parameters"})
		return
	}
	razorpayAdaptor.RequestPay(c, &req)
}

// Razorpay webhook handler placeholder
func RazorpayWebhook(c *gin.Context) {
	bodyBytes, err := io.ReadAll(c.Request.Body)
	if err != nil {
		log.Printf("Failed reading Razorpay webhook body: %v", err)
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}
	c.Request.Body = io.NopCloser(strings.NewReader(string(bodyBytes)))

	signature := c.GetHeader("X-Razorpay-Signature")
	secret := setting.RazorpayWebhookSecret
	if secret == "" {
		log.Println("Razorpay webhook secret not configured")
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}
	if !verifyRazorpaySignature(bodyBytes, signature, secret) {
		log.Println("Razorpay webhook signature verification failed")
		c.AbortWithStatus(http.StatusUnauthorized)
		return
	}

	var event map[string]any
	if err := json.Unmarshal(bodyBytes, &event); err != nil {
		log.Printf("Failed to unmarshal Razorpay webhook JSON: %v", err)
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}

	etype, _ := event["event"].(string)
	if etype == "payment.captured" {
		// Extract order id from payload: payload["payment"].(map)["entity"].(map)["order_id"]
		paymentObj, _ := event["payload"].(map[string]any)["payment"].(map[string]any)
		entity, _ := paymentObj["entity"].(map[string]any)
		orderID, _ := entity["order_id"].(string)
		if orderID == "" {
			log.Println("Razorpay webhook missing order_id")
		} else {
			topUp := model.GetTopUpByTradeNo(orderID)
			if topUp == nil {
				log.Printf("Razorpay topup order not found: %s", orderID)
			} else if topUp.Status != common.TopUpStatusPending {
				log.Printf("Razorpay topup order already processed: %s status=%s", orderID, topUp.Status)
			} else {
				// Mark success and credit quota similar to Recharge but w/out customer id
				quota := topUp.Money * common.QuotaPerUnit
				topUp.CompleteTime = common.GetTimestamp()
				topUp.Status = common.TopUpStatusSuccess
				if err := model.DB.Save(topUp).Error; err != nil {
					log.Printf("Failed updating Razorpay topup: %s err=%v", orderID, err)
				} else {
					if err := model.DB.Model(&model.User{}).Where("id = ?", topUp.UserId).Update("quota", gorm.Expr("quota + ?", quota)).Error; err != nil {
						log.Printf("Failed crediting user quota for Razorpay topup: %s err=%v", orderID, err)
					} else {
						model.RecordLog(topUp.UserId, model.LogTypeTopup, "Razorpay recharge success")
						log.Printf("Razorpay payment captured: order=%s quota=%.2f", orderID, quota)
					}
				}
			}
		}
	} else {
		log.Printf("Ignoring Razorpay event: %s", etype)
	}
	c.Status(http.StatusOK)
}

func verifyRazorpaySignature(body []byte, sig, secret string) bool {
	if sig == "" || secret == "" {
		return false
	}
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(body)
	expected := hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(expected), []byte(sig))
}
