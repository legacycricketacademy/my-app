import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import {
  Client,
  Environment,
  LogLevel,
  OAuthAuthorizationController,
  OrdersController,
} from "@paypal/paypal-server-sdk";

// Convert ES module URL to file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setup server
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'server/public')));

// Setup PayPal client
let client;
try {
  // Get PayPal credentials from environment
  const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;

  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    console.warn('Missing PayPal credentials. Please set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET environment variables.');
    console.warn('Some functionality will be limited.');
  } else {
    client = new Client({
      clientCredentialsAuthCredentials: {
        oAuthClientId: PAYPAL_CLIENT_ID,
        oAuthClientSecret: PAYPAL_CLIENT_SECRET,
      },
      timeout: 0,
      environment: Environment.Sandbox,
      logging: {
        logLevel: LogLevel.Info,
        logRequest: { logBody: true },
        logResponse: { logHeaders: true },
      },
    });
    console.log('PayPal client initialized successfully.');
  }
} catch (error) {
  console.error('Error initializing PayPal client:', error);
}

// PayPal controllers
const ordersController = client ? new OrdersController(client) : null;
const oAuthAuthorizationController = client ? new OAuthAuthorizationController(client) : null;

// Get client token
async function getClientToken() {
  if (!client) {
    throw new Error('PayPal client not initialized. Check your credentials.');
  }
  
  const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64");

  const { result } = await oAuthAuthorizationController.requestToken(
    { authorization: `Basic ${auth}` },
    { intent: "sdk_init", response_type: "client_token" }
  );

  return result.accessToken;
}

// PayPal endpoints
app.get("/paypal/setup", async (req, res) => {
  try {
    const clientToken = await getClientToken();
    res.json({ clientToken });
  } catch (error) {
    console.error('Error getting client token:', error);
    res.status(500).json({ 
      error: 'Failed to get PayPal client token',
      details: error.message
    });
  }
});

app.post("/paypal/order", async (req, res) => {
  try {
    if (!client) {
      throw new Error('PayPal client not initialized. Check your credentials.');
    }
    
    const { amount, currency, intent } = req.body;

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        error: "Invalid amount. Amount must be a positive number."
      });
    }

    if (!currency) {
      return res.status(400).json({ 
        error: "Invalid currency. Currency is required." 
      });
    }

    if (!intent) {
      return res.status(400).json({ 
        error: "Invalid intent. Intent is required." 
      });
    }

    const collect = {
      body: {
        intent: intent,
        purchaseUnits: [
          {
            amount: {
              currencyCode: currency,
              value: amount,
            },
          },
        ],
      },
      prefer: "return=minimal",
    };

    const { body, ...httpResponse } = await ordersController.createOrder(collect);
    const jsonResponse = JSON.parse(String(body));
    const httpStatusCode = httpResponse.statusCode;

    res.status(httpStatusCode).json(jsonResponse);
  } catch (error) {
    console.error("Failed to create order:", error);
    res.status(500).json({ error: "Failed to create order." });
  }
});

app.post("/paypal/order/:orderID/capture", async (req, res) => {
  try {
    if (!client) {
      throw new Error('PayPal client not initialized. Check your credentials.');
    }
    
    const { orderID } = req.params;
    const collect = {
      id: orderID,
      prefer: "return=minimal",
    };

    const { body, ...httpResponse } = await ordersController.captureOrder(collect);
    const jsonResponse = JSON.parse(String(body));
    const httpStatusCode = httpResponse.statusCode;

    res.status(httpStatusCode).json(jsonResponse);
  } catch (error) {
    console.error("Failed to capture order:", error);
    res.status(500).json({ error: "Failed to capture order." });
  }
});

// Add health check endpoint
app.get('/api/ping', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Minimal PayPal server is operational'
  });
});

// Serve the PayPal test page as the default route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'server/public/paypal-test.html'));
});

// Handle all other routes by serving the test page as well
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'server/public/paypal-test.html'));
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`PayPal test server listening on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} to view the PayPal test page`);
});