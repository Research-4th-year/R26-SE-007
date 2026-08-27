const en = {

  //Common Pages
  common: {
    getStarted: "Get Started",
    cancel: "Cancel",
    save: "Save",
    submit: "Submit",
    delete: "Delete",
    edit: "Edit",
    back: "Back",
    next: "Next",
    loading: "Loading...",
    retry: "Retry",
    search: "Search",
    close: "Close",
    yes: "Yes",
    no: "No",
  },

  welcome: {
    eyebrow: "SMART AGRICULTURE PLATFORM",
    title: "Digital Goviya",
    slogan: "Smart Paddy Management System",

    warehouse: "Warehouse",
    farming: "Farming",
    market: "Market",
    forecast: "Forecast",

    getStarted: "Get Started",

    chooseLanguage: "Choose your language",
    english: "English",
    sinhala: "Sinhala",

    languageHint:
      "You can change this anytime in Settings",
  },

  landing: {
    eyebrow: "SMART AGRICULTURE PLATFORM",
    title: "Digital Goviya",
    slogan: "Smart Agricultural Management System",

    modules: "MODULES",

    warehouse: {
      title: "Warehouse Management",
      desc: "PMB paddy warehouse coordination & blockchain audit",
    },

    farming: {
      title: "Digital Farming",
      desc: "Smart farming assistance and crop management",
    },

    marketplace: {
      title: "Marketplace",
      desc: "Agricultural produce trading platform",
    },

    analytics: {
      title: "Paddy Price Forecasting",
      desc: "Price Forecasting & Week Predictions with Explanations",
    },

    soon: "Soon",

    footer: "Digital Goviya v1.0 · SLIIT Research 2026",
  },

  navigation: {
    home: "Home",
    harvest: "Harvest",
    demand: "Demand",
    matching: "Matching",
    partners: "Partners",
    notifications: "Notifications",
    assistant: "AI Assistant",
    profile: "Profile",
    settings: "Settings",
    logout: "Logout",
  },

  auth: {
    login: "Login",
    register: "Register",
    phone: "Phone Number",
    password: "Password",
    confirmPassword: "Confirm Password",
  },




  // C3 Marketplace
  c3login: {
    eyebrow: "DIGITAL GOVIYA MARKETPLACE",
    heading: "Welcome back",
    description:
      "Sign in using the marketplace username assigned to your account.",

    selectAccount: "Select your account",

    farmer: {
      title: "Farmer",
      subtitle: "Sell paddy",
    },

    miller: {
      title: "Miller",
      subtitle: "Purchase paddy",
    },

    username: "Username",
    usernamePlaceholder: "Enter username",

    password: "Password",
    passwordPlaceholder: "Enter password",

    accountInfo:
      "Imported Miller accounts must change the temporary password after their first login.",

    continueAs: "Continue as",

    missingInformation: "Missing information",
    missingInformationMessage:
      "Enter your username and password.",

    loginFailed: "Login failed",
    unableToSignIn: "Unable to sign in.",

    footer: "Digital Goviya v1.0 · SLIIT Research 2026",
  },

  changePassword: {
    createNewPassword: "Create your new password",
    changeYourPassword: "Change your password",

    forcedPasswordSubtitle:
      "Your account was created with a temporary password. Create a new private password before using the marketplace.",

    changePasswordSubtitle:
      "Enter your current password and choose a new password for your marketplace account.",

    accountSecurity: "Account security",

    accountSecuritySubtitle:
      "Keep your marketplace account protected",

    temporaryPassword: "Temporary password",
    newPassword: "New password",
    confirmNewPassword: "Confirm new password",

    enterPassword: "Enter password",

    showPasswords: "Show passwords",
    hidePasswords: "Hide passwords",

    passwordRequirements: "Password requirements",

    atLeast8Characters: "At least 8 characters",
    oneUppercaseLetter: "One uppercase letter",
    oneLowercaseLetter: "One lowercase letter",
    oneNumber: "One number",

    saveNewPassword: "Save New Password",

    securityNote:
      "Your password is encrypted and never shared.",

    missingInformation: "Missing information",
    completeAllFields:
      "Complete all password fields.",

    passwordsDoNotMatch:
      "Passwords do not match",

    confirmPasswordAgain:
      "Confirm your new password again.",

    passwordUpdated: "Password updated",

    passwordUpdatedMessage:
      "Your new password is now active.",

    passwordChangeFailed:
      "Password change failed",

    unableToChangePassword:
      "Unable to change password.",
  },

  // C4 Analytics - Home
  analyticsHome: {
    eyebrow: "AI-POWERED PRICE INSIGHTS",

    title: "Price Prediction\n& Forecasting",

    subtitle:
      "Know today's paddy price and see where it's headed",

    welcome:
      "Get an instant price estimate, or see how prices may move over the next few weeks.",

    prediction: {
      title: "Predict Paddy Price",
      description:
        "Get today's estimated market price for your district in seconds.",
      button: "Start Prediction",
    },

    forecasting: {
      title: "Forecast Future Prices",
      description:
        "See predicted price trends for the coming weeks, visualized on a chart.",
      button: "Start Forecast",
    },

    information: {
      paddyType: "Paddy Type",
      paddyTypeValue: "Long Grain White",
      supportedDistricts: "Supported Districts",
    },
  },

  // C4 Analytics - Price Prediction Input
  predictionInput: {
    eyebrow: "PRICE PREDICTION",

    title: "Get Today's\nPrice Estimate",

    subtitle: "Choose a district and date to continue",

    district: "District",
    selectDistrict: "Select district",

    date: "Date",
    selectDate: "Select date",

    dateHelper: "Today up to {days} days ahead ({maxDate})",

    chooseDate: "Choose a date",

    predictionNote:
      "Predictions are available only for Long Grain White Paddy.",

    predictPrice: "Predict Price",

    selectDistrictTitle: "Select District",
  },

  // C4 Analytics - Price Prediction Result
  predictionResult: {
    eyebrow: "PREDICTION RESULT",

    title: "Today's Price Estimate",

    loading: {
      title: "Crunching the numbers…",
      message: "Getting your price estimate…",
    },

    error: {
      title: "Prediction failed",

      network:
        "Couldn't reach the prediction server. Check your connection and try again.",

      general:
        "Something went wrong while getting your prediction.",

      retry: "Try Again",
    },

    price: {
      predictedPrice: "Predicted Price",

      vsPrevious: "vs previous",

      paddyType: "Long Grain White",

      whyThisPrice: "Why this price?",
    },

    context: {
      district: "District",
      date: "Date",
    },

    advanced: {
      title: "Advanced Details",
      subtitle: "Market outlook & model breakdown",
    },
  },

  // C4 Analytics - Prediction Explanation
  predictionExplanation: {
    eyebrow: "AI EXPLANATION",

    title: "Why this price?",

    generatedByAI: "Generated by AI",
    generatedBySHAP: "Generated by SHAP",
    generatedBy: "Generated by",

    keyFactors: "Key Factors",
  },

  // C4 Analytics - Detailed Analysis
  detailedAnalysis: {
    eyebrow: "ADVANCED DETAILS",

    title: "Behind the Prediction",

    tabs: {
      market: "Market Overview",
      technical: "Technical Details",
    },

    status: {
      trend: "Trend",
      confidence: "Confidence",
      risk: "Risk",
    },

    market: {
      outlook: "Market Outlook",
      recommendation: "Recommendation",
    },

    technical: {
      intro:
        "These are the factors that influenced this prediction most.",

      stepByStep:
        "Step-by-step model reasoning (SHAP).",

      currentValue: "Current Value",
    },

    features: {
      max_price: "Maximum Market Price",
      min_price: "Minimum Market Price",
      avg_price: "Average Market Price",
    },
  },

  // C4 Analytics - Forecast Input
  forecastInput: {
    eyebrow: "PRICE FORECAST",

    title: "See Where Prices\nAre Headed",

    subtitle: "Choose a district and forecast length",

    district: "District",
    selectDistrict: "Select district",

    startDate: "Start Date",

    startDateHelper:
      "Forecast starts automatically from today",

    forecastLength: "Forecast Length",

    week: "Week",
    weeks: "Weeks",

    paddyType: "Long Grain White Paddy",

    generateForecast: "Generate Forecast",

    selectDistrictTitle: "Select District",
  },

  // C4 Analytics - Forecast Result
  forecastResult: {
    eyebrow: "FORECAST RESULT",

    title: "{weeks}-Week Price Forecast",

    starting: "Starting",

    loadingTitle: "Crunching the numbers…",
    loadingText: "Generating your forecast…",

    errorTitle: "Forecast failed",
    networkError:
      "Couldn't reach the forecast server. Check your connection and try again.",
    generalError:
      "Something went wrong while generating your forecast.",

    tryAgain: "Try Again",

    chart: {
      predictedPriceTrend: "Predicted Price Trend",
      paddyType: "Long Grain White",
    },

    stats: {
      highest: "Highest",
      lowest: "Lowest",
      average: "Average",
      unit: "LKR/kg",
    },

    insight: {
      title: "Forecast Insight",

      stable:
        "Prices are expected to remain relatively stable over the selected period.",

      rising:
        "Prices are projected to rise gradually, up roughly {percentage}% by the end of this period.",

      falling:
        "Prices are projected to ease gradually, down roughly {percentage}% by the end of this period.",
    },

    weeklyBreakdown: "View Weekly Breakdown",
  },

  // C4 Analytics - Weekly Breakdown
  weeklyBreakdown: {
    eyebrow: "WEEKLY BREAKDOWN",

    title: "{weeks}-Week Forecast Detail",

    week: "Week",

    priceUnit: "LKR/kg",

    backToHome: "Back to Home",
  },

};

export default en;