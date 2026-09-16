from django.urls import path
from payments.views import (
    ValidateCouponView,
    CreatePaymentOrderView,
    VerifyPaymentView,
    PaymentHistoryView,
    PaymentReceiptView
)

urlpatterns = [
    path('coupons/validate/', ValidateCouponView.as_view(), name='validate_coupon'),
    path('order/', CreatePaymentOrderView.as_view(), name='create_payment_order'),
    path('verify/', VerifyPaymentView.as_view(), name='verify_payment'),
    path('history/', PaymentHistoryView.as_view(), name='payment_history'),
    path('<int:payment_id>/receipt/', PaymentReceiptView.as_view(), name='payment_receipt'),
]
