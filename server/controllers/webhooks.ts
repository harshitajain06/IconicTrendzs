import { verifyWebhook } from "@clerk/express/webhooks";
import { Request, Response } from "express";

export const clerkWebhook = async (req: Request, res: Response) => {
    try {
      const evt = await verifyWebhook(req)
  
      
      const { id } = evt.data
      const eventType = evt.type
      console.log(`Received webhook with ID ${id} and event type of ${eventType}`)
      console.log('Webhook payload:', evt.data)
  
      return res.send('Webhook received')
    } catch (err) {
      console.error('Error verifying webhook:', err)
      return res.status(400).send('Error verifying webhook')
    }
  }