import { useState, useEffect } from "react"
import { Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, Shield, CheckCircle, RotateCcw, Clock } from "lucide-react"
import { useNavigate } from 'react-router-dom';
import { sendOtpToEmail, verifyOtp, resetPassword } from '../api/auth';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1)
  const [isVisible, setIsVisible] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [formData, setFormData] = useState({
    email: "",
    verificationCode: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState({})

  // Password strength checker
  const getPasswordStrength = (password) => {
    const checks = {
      length: password.length >= 8,
      lowercase: /(?=.*[a-z])/.test(password),
      uppercase: /(?=.*[A-Z])/.test(password),
      number: /(?=.*\d)/.test(password),
    }
    
    const passedChecks = Object.values(checks).filter(Boolean).length
    const totalChecks = Object.keys(checks).length
    
    return {
      checks,
      strength: passedChecks,
      total: totalChecks,
      percentage: (passedChecks / totalChecks) * 100
    }
  }

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({
              ...prev,
              [entry.target.id]: true,
            }))
          }
        })
      },
      { threshold: 0.1 },
    )

    const elements = document.querySelectorAll("[data-animate]")
    elements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  // Countdown timer for resend code
  useEffect(() => {
    let timer
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [countdown])

  const steps = [
    {
      step: 1,
      title: "Enter Email",
      subtitle: "We'll send you a reset link",
      icon: <Mail className="w-6 h-6 text-white" />,
    },
    {
      step: 2,
      title: "Verify Code",
      subtitle: "Enter the code we sent you",
      icon: <Shield className="w-6 h-6 text-white" />,
    },
    {
      step: 3,
      title: "New Password",
      subtitle: "Create your new password",
      icon: <Lock className="w-6 h-6 text-white" />,
    },
  ]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }
  }

  const validateStep = (step) => {
    const newErrors = {}

    if (step === 1) {
      if (!formData.email.trim()) {
        newErrors.email = "Email is required"
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = "Please enter a valid email address"
      }
    }

    if (step === 2) {
      if (!formData.verificationCode.trim()) {
        newErrors.verificationCode = "Verification code is required"
      } else if (formData.verificationCode.length !== 6) {
        newErrors.verificationCode = "Verification code must be 6 digits"
      }
    }

    if (step === 3) {
      if (!formData.newPassword) {
        newErrors.newPassword = "New password is required"
      } else if (formData.newPassword.length < 8) {
        newErrors.newPassword = "Password must be at least 8 characters"
      } else if (!/(?=.*[a-z])/.test(formData.newPassword)) {
        newErrors.newPassword = "Password must contain at least one lowercase letter"
      } else if (!/(?=.*[A-Z])/.test(formData.newPassword)) {
        newErrors.newPassword = "Password must contain at least one uppercase letter"
      } else if (!/(?=.*\d)/.test(formData.newPassword)) {
        newErrors.newPassword = "Password must contain at least one number"
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password"
      } else if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNextStep = async () => {
    if (validateStep(currentStep)) {
      setIsLoading(true)

      try {
        if (currentStep === 1) {
          // Send OTP
          const result = await sendOtpToEmail(formData.email)
          if (result.success) {
            toast.success("Verification code sent to your email!")
            setCurrentStep(2)
            setCountdown(60) // Start countdown for resend
          } else {
            toast.error(result.error)
          }
        } else if (currentStep === 2) {
          // Verify OTP
          try {
            await verifyOtp(formData.email, formData.verificationCode)
            toast.success("Code verified successfully!")
            setCurrentStep(3)
          } catch (error) {
            toast.error(error.message)
          }
        } else if (currentStep === 3) {
          // Reset password
          const result = await resetPassword(formData.email, formData.newPassword)
          if (result.message) {
            toast.success("Password reset successfully!")
            setCurrentStep(4)
          } else {
            toast.error(result.error || "Password reset failed")
          }
        }
      } catch (error) {
        toast.error("An error occurred. Please try again.")
        console.error("Error:", error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 1 && currentStep < 4) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleResendCode = async () => {
    if (countdown === 0) {
      setIsLoading(true)
      try {
        const result = await sendOtpToEmail(formData.email)
        if (result.success) {
          toast.success("Verification code resent!")
          setCountdown(60)
        } else {
          toast.error(result.error)
        }
      } catch (error) {
        toast.error("Failed to resend code. Please try again.")
        console.error("Error resending code:", error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleBackToLogin = () => {
    navigate('/login');
  }

  const handleContactSupport = () => {
    navigate('/contact');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Custom animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes slideInFromTop {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out;
        }
        
        .animate-slide-in-top {
          animation: slideInFromTop 0.6s ease-out;
        }
      `}</style>

      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="text-2xl font-bold text-gray-800">
                <span className="text-blue-600">Money</span>Mate
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-gray-600 text-sm">Remember your password?</span>
              <button
                onClick={handleBackToLogin}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-120px)] px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md w-full space-y-8">
          {/* Progress Steps */}
          {currentStep < 4 && (
            <div className="flex justify-center mb-8" data-animate id="steps">
              <div
                className={`flex items-center space-x-4 transition-all duration-700 ${
                  isVisible["steps"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                }`}
              >
                {steps.map((step, index) => (
                  <div key={step.step} className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold transition-all duration-300 ${
                        currentStep >= step.step
                          ? "bg-blue-600 scale-110"
                          : "bg-gray-300"
                      }`}
                    >
                      {currentStep > step.step ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        step.step
                      )}
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`w-8 h-0.5 mx-2 transition-all duration-300 ${
                          currentStep > step.step ? "bg-blue-600" : "bg-gray-300"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Header Section */}
          <div className="text-center" data-animate id="header">
            <div
              className={`transition-all duration-700 ${
                isVisible["header"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
            >
              {currentStep < 4 ? (
                <>
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    {steps[currentStep - 1]?.icon}
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{steps[currentStep - 1]?.title}</h1>
                  <p className="text-gray-600 mb-8">{steps[currentStep - 1]?.subtitle}</p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Password Reset!</h1>
                  <p className="text-gray-600 mb-8">Your password has been successfully updated</p>
                </>
              )}
            </div>
          </div>

          {/* Form Content */}
          <div className="mt-8" data-animate id="form-content">
            <div
              className={`bg-white rounded-lg shadow-lg p-8 border border-gray-200 transition-all duration-700 ${
                isVisible["form-content"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
            >
              {/* Step 1: Enter Email */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-fade-in-up">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Enter your email address"
                        className={`w-full pl-10 pr-4 py-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-gray-50 text-gray-900 placeholder-gray-500 hover:bg-white ${
                          errors.email ? "border-red-500 bg-red-50" : "border-gray-300"
                        }`}
                      />
                    </div>
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <div className="flex items-start">
                      <Mail className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <h3 className="text-sm font-medium text-blue-800">What happens next?</h3>
                        <p className="text-sm text-blue-700 mt-1">
                          We'll send a 6-digit verification code to your email address. This code will expire in 10 minutes.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Verify Code */}
              {currentStep === 2 && (
                <div className="space-y-6 animate-fade-in-up">
                  <div className="text-center mb-6">
                    <p className="text-gray-600">
                      We sent a verification code to{" "}
                      <span className="font-semibold text-blue-600">{formData.email}</span>
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Verification Code</label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        name="verificationCode"
                        value={formData.verificationCode}
                        onChange={handleInputChange}
                        placeholder="Enter 6-digit code"
                        maxLength={6}
                        className={`w-full pl-10 pr-4 py-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-center text-lg font-mono bg-gray-50 text-gray-900 placeholder-gray-500 hover:bg-white ${
                          errors.verificationCode ? "border-red-500 bg-red-50" : "border-gray-300"
                        }`}
                      />
                    </div>
                    {errors.verificationCode && <p className="text-red-500 text-sm mt-1">{errors.verificationCode}</p>}
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">Didn't receive the code?</p>
                    <button
                      onClick={handleResendCode}
                      disabled={countdown > 0 || isLoading}
                      className={`text-sm font-medium transition-colors ${
                        countdown > 0 || isLoading
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-blue-600 hover:text-blue-700"
                      }`}
                    >
                      {countdown > 0 ? (
                        <span className="flex items-center justify-center">
                          <Clock className="w-4 h-4 mr-1" />
                          Resend in {countdown}s
                        </span>
                      ) : (
                        <span className="flex items-center justify-center">
                          <RotateCcw className="w-4 h-4 mr-1" />
                          Resend Code
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: New Password */}
              {currentStep === 3 && (
                <div className="space-y-6 animate-fade-in-up">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleInputChange}
                        placeholder="Create a strong password"
                        className={`w-full pl-10 pr-12 py-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-gray-50 text-gray-900 placeholder-gray-500 hover:bg-white ${
                          errors.newPassword ? "border-red-500 bg-red-50" : "border-gray-300"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.newPassword && <p className="text-red-500 text-sm mt-1">{errors.newPassword}</p>}
                    
                    {/* Password Strength Indicator */}
                    {formData.newPassword && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Password Strength</span>
                          <span className="text-sm text-gray-500">
                            {getPasswordStrength(formData.newPassword).strength}/{getPasswordStrength(formData.newPassword).total}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              getPasswordStrength(formData.newPassword).percentage <= 25
                                ? "bg-red-500"
                                : getPasswordStrength(formData.newPassword).percentage <= 50
                                ? "bg-yellow-500"
                                : getPasswordStrength(formData.newPassword).percentage <= 75
                                ? "bg-blue-500"
                                : "bg-green-500"
                            }`}
                            style={{ width: `${getPasswordStrength(formData.newPassword).percentage}%` }}
                          ></div>
                        </div>
                        
                        {/* Password Requirements */}
                        <div className="mt-3 space-y-1">
                          {Object.entries(getPasswordStrength(formData.newPassword).checks).map(([requirement, met]) => (
                            <div key={requirement} className="flex items-center text-sm">
                              <div className={`w-4 h-4 rounded-full mr-2 flex items-center justify-center ${
                                met ? "bg-green-500" : "bg-gray-300"
                              }`}>
                                {met ? (
                                  <CheckCircle className="w-3 h-3 text-white" />
                                ) : (
                                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                )}
                              </div>
                              <span className={met ? "text-green-600" : "text-gray-500"}>
                                {requirement === "length" && "At least 8 characters"}
                                {requirement === "lowercase" && "Contains lowercase letter"}
                                {requirement === "uppercase" && "Contains uppercase letter"}
                                {requirement === "number" && "Contains a number"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Confirm your new password"
                        className={`w-full pl-10 pr-12 py-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-gray-50 text-gray-900 placeholder-gray-500 hover:bg-white ${
                          errors.confirmPassword ? "border-red-500 bg-red-50" : "border-gray-300"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <div className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <h3 className="text-sm font-medium text-green-800">Password Requirements</h3>
                        <ul className="text-sm text-green-700 mt-1 space-y-1">
                          <li>• At least 8 characters long</li>
                          <li>• Include uppercase and lowercase letters</li>
                          <li>• Include at least one number</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Success */}
              {currentStep === 4 && (
                <div className="text-center space-y-6 animate-fade-in-up">
                  <div className="bg-green-50 border border-green-200 rounded-md p-6">
                    <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-green-800 mb-2">Password Successfully Reset!</h3>
                    <p className="text-green-700">
                      Your password has been updated. You can now sign in with your new password.
                    </p>
                  </div>

                  <button
                    onClick={handleBackToLogin}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-semibold hover:bg-blue-700 transition-all duration-300 flex items-center justify-center"
                  >
                    Back to Sign In
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </button>
                </div>
              )}

              {/* Navigation Buttons */}
              {currentStep < 4 && (
                <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                  {currentStep > 1 && (
                    <button
                      onClick={handlePrevStep}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-all duration-300 flex items-center"
                    >
                      <ArrowLeft className="w-5 h-5 mr-2" />
                      Back
                    </button>
                  )}

                  <button
                    onClick={handleNextStep}
                    disabled={isLoading}
                    className={`px-8 py-3 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition-all duration-300 flex items-center disabled:opacity-50 disabled:cursor-not-allowed ${
                      currentStep === 1 ? "ml-auto" : ""
                    }`}
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    ) : (
                      <>
                        {currentStep === 1 && "Send Code"}
                        {currentStep === 2 && "Verify Code"}
                        {currentStep === 3 && "Reset Password"}
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Help Section */}
          <div className="text-center mt-8" data-animate id="help">
            <div
              className={`transition-all duration-700 delay-300 ${
                isVisible["help"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
            >
              <p className="text-sm text-gray-600 mb-2">Need help?</p>
              <button
                onClick={handleContactSupport}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword

