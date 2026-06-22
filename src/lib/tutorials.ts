export interface TutorialStep {
  title: string
  desc: string
}

export interface Tutorial {
  slug: string
  title: string
  description: string
  icon: string
  duration: string
  steps: TutorialStep[]
  tips: string[]
  relatedLink?: string
  relatedLabel?: string
}

export const tutorials: Tutorial[] = [
  {
    slug: "getting-started",
    title: "Getting Started",
    description: "Log in to your account, explore the dashboard, and understand the main navigation.",
    icon: "🚀",
    duration: "5 min",
    steps: [
      { title: "Log In", desc: "Go to the login page and enter your email and password. If you're new, click 'Create Company' to sign up or 'Try Demo Account' to explore without registering." },
      { title: "Dashboard Overview", desc: "After logging in, you land on the Dashboard. Here you'll see your wallet balances, recent transactions, money flow, commission flow, and currency tabs." },
      { title: "Understand Your Role", desc: "Your permissions depend on your role: Company Owner (full access), Company Admin (management), Branch Manager (own branch), Teller (front desk), Compliance Officer (verification), Auditor (read-only)." },
      { title: "Navigate the Sidebar", desc: "Use the left sidebar to access all sections: Dashboard, Transactions, Customers, Branches, Staff, Exchange Rates, Commissions, Reports, Settings, and Help." },
      { title: "Check Notifications", desc: "Click the bell icon to view your notifications. You'll receive alerts for incoming transfers, warnings, and system announcements." },
    ],
    tips: ["Use the demo account (admin@trustbank.com / Admin@123) to explore all features before registering.", "If you're a Teller or Branch Manager, you'll only see data relevant to your branch."],
    relatedLink: "/company/dashboard",
    relatedLabel: "Go to Dashboard",
  },
  {
    slug: "creating-transactions",
    title: "Creating Your First Transaction",
    description: "Send money from one branch to another with the correct sender, receiver, and amount.",
    icon: "💸",
    duration: "8 min",
    steps: [
      { title: "Click New Transaction", desc: "From the sidebar, click 'Transfers' then 'New Transaction'. You can also use the quick action button on the dashboard." },
      { title: "Select Transaction Type", desc: "Choose from: Cash → Cash (cash pickup), Cash → Mobile Money, Mobile → Cash (withdrawal), or Mobile → Mobile." },
      { title: "Fill Sender Details", desc: "Enter the sender's full name and phone number. Optional fields include nationality, ID type, and ID number. The system creates a new customer if one doesn't exist." },
      { title: "Fill Receiver Details", desc: "Enter the receiver's full name and phone number. Select the destination branch where the receiver will collect the money." },
      { title: "Enter Amount & Currency", desc: "Type the transfer amount and select the currency. The available currencies depend on your subscription plan." },
      { title: "Review Commission", desc: "The system calculates commission automatically. Choose 'Included' (deducted from amount) or 'Separate' (added on top)." },
      { title: "Create Transaction", desc: "Click 'Create Transaction'. The system generates a unique secret code. Share this code with the receiver so they can collect the payout." },
    ],
    tips: ["The secret code is the most important piece of information — the receiver must provide it to claim the money.", "Transactions can be cancelled by the sending branch before payout."],
    relatedLink: "/company/transfers/new",
    relatedLabel: "New Transaction",
  },
  {
    slug: "processing-payouts",
    title: "Processing a Payout",
    description: "Verify the secret code and complete a payout at the receiving branch.",
    icon: "✅",
    duration: "5 min",
    steps: [
      { title: "Find Incoming Transfers", desc: "Go to 'Transfers' → 'Incoming' or click the 'Incoming' button on the transfers page. This shows all transactions pending payout at your branch." },
      { title: "Select a Transfer", desc: "Click the 'Pay' button next to the pending transfer you want to process." },
      { title: "Verify Customer Identity", desc: "Ask the customer for their ID and the secret code provided by the sender. Verify the name matches." },
      { title: "Enter Secret Code", desc: "Type the customer's secret code into the verification field. The code is case-sensitive and typically 8 characters." },
      { title: "Complete Payout", desc: "Click 'Verify & Complete Payout'. The transaction status changes to COMPLETED and a receipt is generated." },
    ],
    tips: ["Always verify the customer's ID before completing the payout.", "If the customer doesn't have the secret code, the sending branch can look it up in the transaction details.", "Completed transactions cannot be reversed — double-check before confirming."],
    relatedLink: "/company/transfers/incoming",
    relatedLabel: "Incoming Transfers",
  },
  {
    slug: "managing-customers",
    title: "Managing Customers",
    description: "Register, verify, and manage customer information for KYC compliance.",
    icon: "👥",
    duration: "6 min",
    steps: [
      { title: "View Customers", desc: "Click 'Customers' in the sidebar to see all registered customers. Use the search bar to find customers by name or phone number." },
      { title: "Add a Customer", desc: "Click 'Add Customer' to open the creation dialog. Enter the customer's full name, phone number, nationality, ID type, and ID number." },
      { title: "View Customer Details", desc: "Click on a customer to view their full profile, including their verification status, risk level, and transaction history." },
      { title: "Verify a Customer", desc: "From the customer detail page, update their verification status to APPROVED, PENDING, or REJECTED. Set a risk level (LOW, MEDIUM, HIGH)." },
      { title: "Compliance Overview", desc: "Go to 'Compliance' in the sidebar for a dashboard view of all customers by verification status and risk level." },
    ],
    tips: ["Customers are auto-created when you make a transfer with a new phone number.", "KYC verification is recommended for regulatory compliance.", "Set appropriate risk levels to flag high-risk customers for review."],
    relatedLink: "/company/customers",
    relatedLabel: "Manage Customers",
  },
  {
    slug: "branch-operations",
    title: "Branch Operations",
    description: "Create and manage branches, assign staff, and monitor branch performance.",
    icon: "🏢",
    duration: "7 min",
    steps: [
      { title: "View Branches", desc: "Click 'Branches' in the sidebar to see all your company's branches, their status (Active/Inactive), staff count, and wallet balances." },
      { title: "Create a Branch", desc: "Click 'New Branch'. Fill in the branch name, country, city, address, and contact details. The system auto-generates a branch code." },
      { title: "Edit a Branch", desc: "Click the edit icon on any branch to update its name, address, contact information, or activate/deactivate it." },
      { title: "Delete a Branch", desc: "Only Company Owners can delete branches. A branch cannot be deleted if it has active staff or transactions." },
      { title: "Branch Wallets", desc: "Each branch has wallets for each currency supported by your plan. Wallets are created automatically when you add a branch." },
    ],
    tips: ["Small Company plans allow 2 branches, Medium allows 10, and Enterprise has unlimited.", "Deactivating a branch suspends all operations at that location.", "Branch performance metrics are visible on the Dashboard."],
    relatedLink: "/company/branches",
    relatedLabel: "Manage Branches",
  },
  {
    slug: "staff-management",
    title: "Staff Management",
    description: "Invite team members, assign roles, and manage staff access.",
    icon: "👤",
    duration: "6 min",
    steps: [
      { title: "View Staff", desc: "Click 'Staff' in the sidebar to see all team members, their roles, assigned branches, and status." },
      { title: "Invite Staff", desc: "Click 'Invite Staff'. Enter the staff member's name, email, phone, position, and select their role and branch assignment." },
      { title: "Assign Roles", desc: "Choose from: Company Admin (full access), Branch Manager (branch operations), Teller (transactions), Compliance Officer (verification), or Auditor (read-only)." },
      { title: "Edit or Suspend", desc: "Click the edit icon to update staff details or change their role. Use Suspend/Activate to control access without deleting." },
      { title: "Delete Staff", desc: "Only Company Owners can delete staff. Deleted staff are deactivated and removed from the active list, but their audit trail is preserved." },
    ],
    tips: ["Staff plans limit: Small = 5 staff, Medium = 25, Enterprise = unlimited.", "Branch Managers can only manage staff within their own branch.", "New staff receive an INVITED status and must be activated before they can log in."],
    relatedLink: "/company/staff",
    relatedLabel: "Manage Staff",
  },
  {
    slug: "exchange-rates",
    title: "Managing Exchange Rates",
    description: "Add, edit, and manage currency exchange rates for your business.",
    icon: "💱",
    duration: "5 min",
    steps: [
      { title: "View Rates", desc: "Click 'Exchange Rates' in the sidebar to see all configured currency pairs, buy/sell rates, and status." },
      { title: "Add a Rate", desc: "Click 'Add Rate'. Select the From and To currencies, then enter the Buy Rate (what you buy at) and Sell Rate (what you sell at)." },
      { title: "Edit a Rate", desc: "Click the edit icon on any rate to update the buy/sell values. Rates update in real-time." },
      { title: "Toggle Active/Inactive", desc: "Use the toggle button to activate or deactivate a rate. Inactive rates are hidden from the public marketplace." },
      { title: "Public Marketplace", desc: "Your active public rates appear on the homepage exchange rate board and the public /exchange-rates page for customers to compare." },
    ],
    tips: ["Only SSP, KES, UGX, USD, EUR, GBP, and AED are supported.", "The best buy rate is highlighted in green on the public board.", "Rates update every 8 seconds on the live board."],
    relatedLink: "/company/exchange-rates",
    relatedLabel: "Exchange Rates",
  },
  {
    slug: "commissions",
    title: "Commission Settings",
    description: "Configure per-currency commission rules for your transactions.",
    icon: "📊",
    duration: "5 min",
    steps: [
      { title: "Open Commission Settings", desc: "Click 'Commissions' in the sidebar to open the per-currency commission configuration page." },
      { title: "Select a Currency", desc: "Click on a currency tab (SSP, USD, KES, etc.) to view or edit the commission rules for that currency." },
      { title: "Choose Commission Mode", desc: "Select from: Percentage (% of amount), Fixed Amount (flat fee per transaction), or Hybrid (percentage with a minimum fee)." },
      { title: "Set the Value", desc: "Enter the percentage rate or fixed fee amount depending on the mode you selected." },
      { title: "Preview & Save", desc: "Use the preview table to see commission amounts for different transaction values. Click 'Save' to apply." },
    ],
    tips: ["Commission is calculated automatically on every transaction.", "Separate commissions are paid on top of the transfer amount. Included commissions are deducted from the amount.", "Set a minimum fee for Hybrid mode to ensure small transactions still generate revenue."],
    relatedLink: "/company/commissions",
    relatedLabel: "Commission Settings",
  },
  {
    slug: "reports",
    title: "Reports & Analytics",
    description: "Generate and export reports for transactions, commissions, and business insights.",
    icon: "📈",
    duration: "6 min",
    steps: [
      { title: "Open Reports", desc: "Click 'Reports' in the sidebar to access the reporting dashboard." },
      { title: "Choose Report Type", desc: "Select from transaction reports, commission reports, or other data summaries." },
      { title: "Filter by Date Range", desc: "Use date filters to narrow down the report period. You can view today, this week, this month, or a custom range." },
      { title: "Export Reports", desc: "Click the export button to download reports as PDF, Excel, or CSV files for external analysis or record-keeping." },
      { title: "Dashboard Analytics", desc: "The main Dashboard provides real-time analytics: transaction volumes, money flow, commission flow, branch performance rankings, and daily volume charts." },
    ],
    tips: ["Enterprise plans include advanced analytics and custom report builders.", "Export reports for your accountant or regulatory submissions.", "The daily volume chart shows transaction trends for the current month."],
    relatedLink: "/company/reports",
    relatedLabel: "View Reports",
  },
  {
    slug: "compliance-audit",
    title: "Compliance & Audit",
    description: "Manage customer verification, view audit logs, and handle enforcement actions.",
    icon: "🛡️",
    duration: "5 min",
    steps: [
      { title: "Compliance Dashboard", desc: "Go to 'Compliance' to see customer verification statuses at a glance: approved, pending, and rejected." },
      { title: "Verify Customers", desc: "Review unverified customers and update their verification status. Set appropriate risk levels based on your KYC procedures." },
      { title: "View Audit Logs", desc: "Go to 'Audit Logs' to see a complete history of actions taken in your company — who did what and when." },
      { title: "Track Changes", desc: "Audit logs record every transaction creation, staff invitation, rate update, branch change, and more for full traceability." },
      { title: "Enforcement Actions", desc: "Platform administrators can issue warnings, suspend, or reactivate companies through the Enforcement panel." },
    ],
    tips: ["Audit logs cannot be deleted — they provide a permanent record for regulatory compliance.", "Warnings appear on the company dashboard and must be acknowledged.", "Use the Compliance tab in the customer detail page for individual verification."],
    relatedLink: "/company/compliance",
    relatedLabel: "Compliance Dashboard",
  },
]

export function getTutorial(slug: string): Tutorial | undefined {
  return tutorials.find((t) => t.slug === slug)
}
