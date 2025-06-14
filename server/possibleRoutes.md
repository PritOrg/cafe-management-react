### 🔐 **Authentication / Authorization**

| Route                | Method | Middleware            | Description                                                   |
| -------------------- | ------ | --------------------- | ------------------------------------------------------------- |
| `/api/auth/register` | POST   | -                     | Register customer                                             |
| `/api/auth/login`    | POST   | -                     | Login customer                                                |
| `/api/auth/logout`   | POST   | `ensureAuthenticated` | Invalidate token (if using JWT blacklist or refresh strategy) |
| `/api/auth/me`       | GET    | `ensureAuthenticated` | Get logged-in customer profile                                |

### 👤 **Customer Profile**

| Route                    | Method | Middleware                      | Description            |
| ------------------------ | ------ | ------------------------------- | ---------------------- |
| `/api/customers`         | GET    | Admin only                      | Get all customers      |
| `/api/customers/profile` | GET    | `ensureAuthenticated`           | Get own profile        |
| `/api/customers/profile` | PUT    | `ensureAuthenticated`           | Update own profile     |
| `/api/customers/profile` | DELETE | `ensureAuthenticated`           | Delete own account     |
| `/api/customers/photo`   | POST   | `ensureAuthenticated`, `upload` | Upload profile picture |

### 🍽️ **Menu Items**

| Route           | Method | Middleware              | Description         |
| --------------- | ------ | ----------------------- | ------------------- |
| `/api/menu`     | GET    | Public                  | Get all menu items  |
| `/api/menu/:id` | GET    | Public                  | Get menu item by ID |
| `/api/menu`     | POST   | `ensureAdmin`, `upload` | Create menu item    |
| `/api/menu/:id` | PUT    | `ensureAdmin`           | Update menu item    |
| `/api/menu/:id` | DELETE | `ensureAdmin`           | Delete menu item    |

### 🛒 **Orders**

| Route                    | Method | Middleware            | Description                              |
| ------------------------ | ------ | --------------------- | ---------------------------------------- |
| `/api/orders`            | POST   | `ensureAuthenticated` | Place a new order                        |
| `/api/orders/mine`       | GET    | `ensureAuthenticated` | Get own orders                           |
| `/api/orders/:id`        | GET    | `ensureAuthenticated` | Get specific order                       |
| `/api/orders/:id/status` | PUT    | `ensureAdminOrWaiter` | Update order status                      |
| `/api/orders`            | GET    | `ensureAdminOrWaiter` | Get all orders (for admin/kitchen staff) |

### 👨‍🍳 **Staff Management**

| Route            | Method | Middleware    | Description   |
| ---------------- | ------ | ------------- | ------------- |
| `/api/staff`     | GET    | `ensureAdmin` | Get all staff |
| `/api/staff`     | POST   | `ensureAdmin` | Add new staff |
| `/api/staff/:id` | PUT    | `ensureAdmin` | Update staff  |
| `/api/staff/:id` | DELETE | `ensureAdmin` | Remove staff  |

### 📦 **Inventory Management**

| Route                | Method | Middleware    | Description           |
| -------------------- | ------ | ------------- | --------------------- |
| `/api/inventory`     | GET    | `ensureAdmin` | Get all inventory     |
| `/api/inventory`     | POST   | `ensureAdmin` | Add inventory item    |
| `/api/inventory/:id` | PUT    | `ensureAdmin` | Update inventory item |
| `/api/inventory/:id` | DELETE | `ensureAdmin` | Delete inventory item |

### 💬 **Feedback / Reviews**

| Route           | Method | Middleware            | Description       |
| --------------- | ------ | --------------------- | ----------------- |
| `/api/feedback` | POST   | `ensureAuthenticated` | Submit feedback   |
| `/api/feedback` | GET    | `ensureAdmin`         | View all feedback |

### 💳 **Payments (if integrated)** *(Stripe, Razorpay, etc.)*

| Route                   | Method | Middleware                      | Description           |
| ----------------------- | ------ | ------------------------------- | --------------------- |
| `/api/payments/create`  | POST   | `ensureAuthenticated`           | Create payment intent |
| `/api/payments/webhook` | POST   | Public (with secret validation) | Handle payment events |

### 📊 **Reports (for Admin Dashboard)**

| Route                    | Method | Middleware    | Description            |
| ------------------------ | ------ | ------------- | ---------------------- |
| `/api/reports/orders`    | GET    | `ensureAdmin` | Get order stats        |
| `/api/reports/revenue`   | GET    | `ensureAdmin` | Get revenue stats      |
| `/api/reports/customers` | GET    | `ensureAdmin` | Active customers, etc. |


