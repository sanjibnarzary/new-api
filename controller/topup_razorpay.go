package controller

import (
	"log"
	"net/http"
	"one-api/common"
	"one-api/model"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/razorpay/razorpay-go/v2/razorpay"
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

	client := razorpay.NewClient("YOUR_KEY_ID", "YOUR_KEY_SECRET") // Replace with your Razorpay keys
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
	// Implement Razorpay webhook verification and payment status update here
	c.Status(http.StatusOK)
}
