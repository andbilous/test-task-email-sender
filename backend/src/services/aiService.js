import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

class AIService {
  static async routeEmailType(prompt) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a router assistant that classifies email prompts. 
            Analyze the user's prompt and determine if it's a 'sales' email or 'follow-up' email.
            
            Sales emails are for:
            - Selling products/services
            - Business proposals
            - Cold outreach
            - Product pitches
            
            Follow-up emails are for:
            - Checking in on previous conversations
            - Meeting follow-ups
            - General reminders
            - Relationship maintenance
            
            Respond with ONLY one word: either 'sales' or 'follow-up'`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 10,
        temperature: 0.1
      });

      const classification = response.choices[0].message.content.trim().toLowerCase();
      return classification === 'sales' ? 'sales' : 'follow-up';
    } catch (error) {
      console.error('Router classification error:', error);
      return 'follow-up';
    }
  }

  static async generateSalesEmail(prompt, to) {
    try {
      const businessDomain = to.split('@')[1] || 'your business';
      
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a sales email specialist. Generate concise, professional sales emails.
            
            Requirements:
            - Keep total email under 40 words
            - Max 7-10 words per sentence
            - Be direct and compelling
            - Include a clear call-to-action
            - Personalize for the recipient's business domain
            - Professional but friendly tone
            
            Return JSON format: {"subject": "...", "body": "..."}`
          },
          {
            role: "user",
            content: `Generate a sales email about: ${prompt}
            Recipient domain: ${businessDomain}
            Recipient email: ${to}`
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      });

      const content = response.choices[0].message.content.trim();
      return JSON.parse(content);
    } catch (error) {
      console.error('Sales email generation error:', error);

      return {
        subject: `Quick question about ${businessDomain}`,
        body: `Hi,\n\nSaw your work. Quick question: ${prompt}?\n\nWorth a chat?\n\nBest regards`
      };
    }
  }

  static async generateFollowUpEmail(prompt, to) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a follow-up email specialist. Generate polite, professional follow-up emails.
            
            Requirements:
            - Polite and respectful tone
            - Reference the original context
            - Include gentle call-to-action
            - Professional closing
            - Keep it concise but warm
            
            Return JSON format: {"subject": "...", "body": "..."}`
          },
          {
            role: "user",
            content: `Generate a follow-up email about: ${prompt}
            Recipient: ${to}`
          }
        ],
        max_tokens: 200,
        temperature: 0.6
      });

      const content = response.choices[0].message.content.trim();
      return JSON.parse(content);
    } catch (error) {
      console.error('Follow-up email generation error:', error);

      return {
        subject: 'Following up',
        body: `Hi,\n\nJust checking in regarding: ${prompt}\n\nWould love to hear your thoughts.\n\nThanks!`
      };
    }
  }

  static async generateEmail(prompt, to) {

    const emailType = await this.routeEmailType(prompt);
    
    if (emailType === 'sales') {
      return await this.generateSalesEmail(prompt, to);
    } else {
      return await this.generateFollowUpEmail(prompt, to);
    }
  }
}

export default AIService;
