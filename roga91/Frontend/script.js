// Global variables
let currentPaymentType = "donation"
let isLoading = false

// DOM elements
const tabButtons = document.querySelectorAll(".tab-btn")
const paymentForm = document.getElementById("paymentForm")
const amountInput = document.getElementById("amount")
const submitBtn = document.getElementById("submitBtn")
const btnText = document.getElementById("btnText")
const loadingSpinner = document.getElementById("loadingSpinner")
const errorMessage = document.getElementById("errorMessage")
const infoText = document.getElementById("infoText")

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  initializeEventListeners()
  updatePaymentInfo()
  updateSubmitButton()
})

// Event listeners
function initializeEventListeners() {
  // Tab switching
  tabButtons.forEach((button) => {
    button.addEventListener("click", handleTabSwitch)
  })

  // Form submission
  paymentForm.addEventListener("submit", handleFormSubmit)

  // Amount input change
  amountInput.addEventListener("input", updateSubmitButton)

  // Real-time form validation
  const inputs = paymentForm.querySelectorAll("input[required]")
  inputs.forEach((input) => {
    input.addEventListener("input", validateForm)
  })
}

// Handle tab switching
function handleTabSwitch(event) {
  const clickedTab = event.target
  const tabType = clickedTab.getAttribute("data-tab")

  // Update active tab
  tabButtons.forEach((btn) => btn.classList.remove("active"))
  clickedTab.classList.add("active")

  // Update current payment type
  currentPaymentType = tabType

  // Update UI
  updatePaymentInfo()
  updateSubmitButton()
  hideError()
}

// Update payment information based on selected type
function updatePaymentInfo() {
  const infoMessages = {
    donation: "💝 Your donation will support ROGA 91 activities and programs.",
    dues: "💳 Your dues payment will be processed for membership benefits.",
  }

  infoText.textContent = infoMessages[currentPaymentType]
}

// Update submit button text and state
function updateSubmitButton() {
  const amount = amountInput.value || "0"
  const actionText = currentPaymentType === "donation" ? "Donate" : "Pay Dues"
  btnText.textContent = `Pay ₦${amount} - ${actionText}`
}

// Form validation
function validateForm() {
  const formData = new FormData(paymentForm)
  const name = formData.get("name")
  const email = formData.get("email")
  const phone = formData.get("phone")
  const amount = formData.get("amount")

  const isValid = name && email && phone && amount && Number.parseInt(amount) >= 100
  submitBtn.disabled = !isValid || isLoading

  return isValid
}

// Handle form submission
async function handleFormSubmit(event) {
  event.preventDefault()

  if (isLoading || !validateForm()) {
    return
  }

  // Get form data
  const formData = new FormData(paymentForm)
  const paymentData = {
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    amount: Number.parseInt(formData.get("amount")),
    type: currentPaymentType,
  }

  // Validate amount
  if (paymentData.amount < 100) {
    showError("Minimum amount is ₦100")
    return
  }

  // Start loading state
  setLoadingState(true)
  hideError()

  try {
    // Initialize payment
    const response = await fetch("/api/payment/initialize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paymentData),
    })

    const result = await response.json()

    if (response.ok && result.authorization_url) {
      // Redirect to Paystack
      window.location.href = result.authorization_url
    } else {
      throw new Error(result.error || "Payment initialization failed")
    }
  } catch (error) {
    console.error("Payment error:", error)
    showError(error.message || "An error occurred. Please try again.")
    setLoadingState(false)
  }
}

// Set loading state
function setLoadingState(loading) {
  isLoading = loading
  submitBtn.disabled = loading

  if (loading) {
    btnText.style.display = "none"
    loadingSpinner.style.display = "block"
  } else {
    btnText.style.display = "block"
    loadingSpinner.style.display = "none"
  }
}

// Show error message
function showError(message) {
  errorMessage.textContent = message
  errorMessage.style.display = "block"
}

// Hide error message
function hideError() {
  errorMessage.style.display = "none"
}

// Utility function to format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(amount)
}

// Handle page visibility change (for handling return from Paystack)
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    // Page became visible again - user might have returned from Paystack
    // Reset form state
    setLoadingState(false)
  }
})
