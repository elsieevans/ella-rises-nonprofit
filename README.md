# Ella Rises - Non-Profit Management System

A professional Node.js/Express web application for managing Ella Rises, a non-profit organization empowering young women to pursue higher education and STEAM careers through mentoring, workshops, and leadership opportunities.

## Features

### Public Website
- **Landing Page**: Engaging hero section with mission highlights and upcoming events
- **Mission Page**: Organization story, values, and impact metrics
- **Programs Page**: STEAM workshops, mentoring, leadership, and cultural arts programs
- **Team Page**: Leadership team and board of directors
- **Get Involved**: Volunteer, donate, and partnership opportunities
- **Donate Page**: Donation form with amount presets and campaign selection
- **Contact Page**: Contact form and organization information

### Authenticated Portal
- **Dashboard**: Overview with stats cards, charts (Chart.js), and recent activity
- **Participants Management**: CRUD operations, milestone tracking, event history
- **Events Management**: Create/edit events, register participants, track attendance
- **Surveys**: Post-event survey collection with satisfaction, usefulness, and NPS scores
- **Milestones**: Define milestones and assign to participants (1-to-many relationship)
- **Donations**: Track donations, campaigns, and donor information

### User Roles
- **Manager**: Full CRUD access to all data
- **Common User**: View-only access to all data

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL with Knex.js ORM
- **Views**: EJS templates
- **Authentication**: express-session, bcrypt
- **Security**: Helmet.js
- **Flash Messages**: connect-flash
- **Charts**: Chart.js (via CDN)

## Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd intexpractice
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp env.example .env
# Edit .env with your database credentials and session secret
```

4. **Create PostgreSQL database**
```sql
CREATE DATABASE ella_rises;
```

5. **Run migrations**
```bash
npm run migrate
```

6. **Seed the database** (optional - adds demo data)
```bash
npm run seed
```

7. **Start the server**
```bash
# Development
npm run dev

# Production
npm start
```

8. **Access the application**
- Public site: http://localhost:3000
- Portal login: http://localhost:3000/auth/login

## Demo Credentials

After running seeds:
- **Manager**: manager@ellarises.org / password123
- **Viewer**: user@ellarises.org / password123

## Project Structure

```
intexpractice/
├── config/
│   └── database.js       # Database connection
├── middleware/
│   └── auth.js           # Authentication middleware
├── migrations/           # Knex migrations
├── routes/
│   ├── public.js         # Public pages
│   ├── auth.js           # Authentication
│   ├── portal.js         # Portal home
│   ├── dashboard.js      # Dashboard & charts
│   ├── participants.js   # Participants CRUD
│   ├── events.js         # Events CRUD
│   ├── surveys.js        # Surveys CRUD
│   ├── milestones.js     # Milestones CRUD
│   └── donations.js      # Donations CRUD
├── seeds/                # Database seeds
├── views/
│   ├── partials/         # Shared templates
│   ├── public/           # Public pages
│   ├── auth/             # Login/register
│   ├── portal/           # Portal pages
│   └── errors/           # Error pages
├── public/
│   ├── css/              # Stylesheets
│   └── js/               # Client-side JS
├── server.js             # Express app
├── knexfile.js           # Knex configuration
└── package.json
```

## Design Features

### ADA Compliance
- Skip links for keyboard navigation
- Proper heading hierarchy (H1, H2, H3)
- ARIA labels and roles
- High contrast color ratios (4.5:1 minimum)
- Focus indicators on all interactive elements
- Semantic HTML structure

### Responsive Web Design (RWD)
- Mobile-first approach
- Fluid typography using clamp()
- Flexible grid layouts
- Collapsible navigation for mobile
- Touch-friendly button sizes

### Color Palette
- **Primary (CTA)**: Deep Teal (#0d5c63) - High contrast for buttons/links
- **Secondary**: Light Pink (#e8a4b4), Light Blue (#a8d5e5)
- **Neutrals**: Professional grays for text and backgrounds

### Typography
- **Primary**: Outfit (clean, modern sans-serif)
- **Display**: Playfair Display (elegant headings)

## Database Schema

### Tables
- **users**: Authentication and roles
- **participants**: Young women enrolled in programs
- **events**: Workshops, panels, and activities
- **event_participants**: Many-to-many event registration
- **milestones**: Achievement definitions
- **participant_milestones**: Milestone achievements (1-to-many)
- **surveys**: Post-event feedback
- **donations**: Donation records

## API Endpoints

### Chart Data
- `GET /portal/dashboard/api/chart-data` - Returns JSON data for dashboard charts

## Scripts

```bash
npm start          # Start production server
npm run dev        # Start with nodemon (development)
npm run migrate    # Run database migrations
npm run migrate:rollback  # Rollback last migration
npm run seed       # Seed database with demo data
```

## Security Features

- Password hashing with bcrypt
- Session-based authentication
- Helmet.js security headers
- Input validation
- Role-based access control

## AWS Elastic Beanstalk Deployment

### Prerequisites

1. **AWS Account** with access to Elastic Beanstalk, RDS, and Certificate Manager
2. **AWS CLI** installed and configured
3. **EB CLI** installed (`pip install awsebcli`)

### Step 1: Create an SSL Certificate

1. Go to **AWS Certificate Manager (ACM)** in your target region
2. Click **Request a certificate** → **Request a public certificate**
3. Enter your domain name (e.g., `yourdomain.com`, `www.yourdomain.com`)
4. Choose **DNS validation** (recommended)
5. Add the CNAME records to your DNS provider
6. Wait for validation (usually 5-30 minutes)
7. Copy the **Certificate ARN** (looks like `arn:aws:acm:us-east-1:123456789:certificate/abc-123-xyz`)

### Step 2: Update Configuration

Edit `.ebextensions/01-https-lb.config` and replace `YOUR_CERTIFICATE_ARN` with your actual certificate ARN:

```yaml
aws:elbv2:listener:443:
  SSLCertificateArns: arn:aws:acm:us-east-1:123456789:certificate/your-cert-id
```

### Step 3: Create RDS Database (PostgreSQL)

1. Go to **Amazon RDS** → **Create database**
2. Choose **PostgreSQL** (version 14+)
3. Select **Free tier** or appropriate size
4. Set database name: `ella_rises`
5. Set master username and password
6. Note the **Endpoint** after creation

### Step 4: Initialize Elastic Beanstalk

```bash
# Initialize EB in your project
eb init

# Select region, platform (Node.js), and create new application
# Choose Node.js 18 or higher
```

### Step 5: Create Environment

```bash
# Create environment with load balancer
eb create ella-rises-prod --elb-type application
```

### Step 6: Set Environment Variables

Set sensitive variables via the EB Console or CLI:

```bash
eb setenv \
  NODE_ENV=production \
  SESSION_SECRET=your-very-secure-random-string-min-32-chars \
  DB_HOST=your-rds-endpoint.region.rds.amazonaws.com \
  DB_PORT=5432 \
  DB_USER=your_db_username \
  DB_PASSWORD=your_db_password \
  DB_NAME=ella_rises
```

### Step 7: Configure Security Groups

Ensure your RDS security group allows inbound PostgreSQL (port 5432) from your Elastic Beanstalk security group.

### Step 8: Run Migrations

SSH into your EB instance to run migrations:

```bash
eb ssh

# On the instance
cd /var/app/current
npm run migrate
npm run seed  # Optional: seed demo data
```

### Step 9: Configure DNS

Point your domain to the Elastic Beanstalk environment:
- Create a CNAME record pointing to your EB URL, or
- Use Route 53 with an Alias record

### Deployment Commands

```bash
# Deploy latest code
eb deploy

# View logs
eb logs

# SSH into instance
eb ssh

# Open in browser
eb open

# Check status
eb status

# View environment health
eb health
```

### Configuration Files

- `.ebextensions/01-https-lb.config` - Load balancer & HTTPS setup
- `.ebextensions/02-https-redirect.config` - HTTP to HTTPS redirect
- `.ebextensions/03-env-vars.config` - Environment variables template
- `.platform/nginx/conf.d/proxy.conf` - Nginx proxy settings
- `Procfile` - Tells EB how to start the app
- `.ebignore` - Files to exclude from deployment

### Troubleshooting

**SSL not working?**
- Verify certificate ARN is correct in `01-https-lb.config`
- Ensure certificate is validated and in the same region as EB
- Check certificate covers your domain

**Database connection fails?**
- Verify RDS security group allows EB instances
- Check environment variables are set correctly
- Ensure RDS is publicly accessible or in same VPC

**HTTP redirect not working?**
- Clear browser cache
- Check nginx logs: `eb ssh` then `cat /var/log/nginx/error.log`

**View detailed logs:**
```bash
eb logs --all
```

## Future Enhancements

- Email notifications (nodemailer)
- File uploads for participant photos
- PDF report generation
- Advanced analytics dashboard
- Event calendar integration
- Online donation processing

## License

ISC

## About Ella Rises

Ella Rises empowers the rising generation of women to pursue higher education and embrace their heritage through mentoring, creative workshops, and leadership opportunities that build both technical competence and artistic confidence. In partnership with UVU and BYU, we provide STEAM programs to encourage women to pursue their interests in science, technology, engineering, arts, and mathematics.

Learn more: [https://www.ellarises.org/](https://www.ellarises.org/)

