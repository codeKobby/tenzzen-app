# How to Get an OpenAI API Key

Follow these steps to obtain an OpenAI API key for quiz generation:

1. **Create an OpenAI Account**

   - Visit [OpenAI's website](https://platform.openai.com/signup)
   - Sign up for an account if you don't have one
   - Verify your email address

2. **Access API Keys**

   - Go to [API Keys page](https://platform.openai.com/api-keys)
   - Click "Create new secret key"
   - Give your key a name (e.g., "LearnFlow Quiz Generation")
   - Copy the key immediately (you won't be able to see it again)

3. **Set Up Billing (Required)**

   - Go to [Billing settings](https://platform.openai.com/account/billing/overview)
   - Add a payment method
   - Set usage limits to control costs
   - Note: New accounts get some free credits

4. **Security Best Practices**

   - Never share your API key
   - Don't commit it to version control
   - Set up usage limits to prevent unexpected charges
   - Monitor your usage in the OpenAI dashboard

5. **Add to Environment Variables**
   - Copy your API key
   - Open `backend/.env`
   - Replace `your_openai_api_key_here` with your actual key

**Important Notes:**

- The API is pay-as-you-go after free credits
- GPT-3.5-turbo is more cost-effective than GPT-4
- Monitor token usage to control costs
- Consider implementing rate limiting

Once you have your API key, provide it to me and I'll update the `.env` file.
