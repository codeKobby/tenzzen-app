# Enabling Billing for Google Cloud Project

To deploy the ADK service to Google Cloud Run, you need to enable billing for your Google Cloud project. This document explains how to do that.

## Steps to Enable Billing

1. **Go to the Google Cloud Console**
   - Visit [https://console.cloud.google.com/](https://console.cloud.google.com/)
   - Make sure you're signed in with the same account you used for authentication

2. **Select Your Project**
   - In the top navigation bar, make sure the "tenzzen" project is selected
   - If not, click on the project selector and choose "tenzzen"

3. **Navigate to Billing**
   - In the left sidebar, click on "Billing"
   - You'll see a message indicating that billing is not enabled for the project

4. **Link a Billing Account**
   - Click on "Link a billing account"
   - If you already have a billing account, select it from the list
   - If you don't have a billing account, click on "Create a new billing account" and follow the instructions

5. **Complete Billing Setup**
   - Follow the prompts to set up your billing account
   - You'll need to provide payment information (credit card or other payment method)
   - Google Cloud offers a free tier and $300 in credits for new accounts

6. **Verify Billing is Enabled**
   - After setting up billing, return to the Billing page
   - Verify that your project is now linked to a billing account

## Important Notes

- **Free Tier**: Google Cloud offers a free tier for many services, including Cloud Run. You can run small workloads without incurring charges.
- **Spending Limits**: You can set up budget alerts and spending limits to avoid unexpected charges.
- **Cost Estimation**: The estimated cost for running this ADK service on Cloud Run is minimal for development purposes (likely under $5/month for light usage).

## After Enabling Billing

Once billing is enabled, you can run the deployment script again:

```bash
cd adk_service
./deploy.sh
```

This will deploy the ADK service to Google Cloud Run.

## Additional Resources

- [Google Cloud Billing Documentation](https://cloud.google.com/billing/docs)
- [Cloud Run Pricing](https://cloud.google.com/run/pricing)
- [Setting Up Budget Alerts](https://cloud.google.com/billing/docs/how-to/budgets)
