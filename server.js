const express = require('express');
const axios = require('axios');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3030;

async function sendRequest(sku, token) {
  try {
    const response = await axios.post(
      'https://connect.squareup.com/v2/catalog/search-catalog-items',
      {
        'text_filter': sku,
        "limit": 1,
      },
      {
        headers: {
          'Square-Version': '2024-01-18',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    for (var item of response.data.items) {
      for (var variations of item.item_data.variations) {
        if (variations.id == response.data.matched_variation_ids) {
          var product_name = item.item_data.name;
          var product_var = variations.item_variation_data.name;
          var price = variations.item_variation_data.price_money.amount;
          price /= 100;
          var sku = variations.item_variation_data.sku;
          return [product_name, product_var, price, sku];
        }
      }
    }
    // If the loop doesn't find any matching variation, handle this case
    throw new Error("No matching variation found.");
  } catch (error) {
    // Display the error in the responseContainer div or handle it appropriately
    console.error(error);
    throw error;
  }
}

app.get('/generate-json', async (req, res) =>  {
  const { sku, token } = req.query;

  // Check if parameters are provided
  if (!sku || !token) {
    return res.status(400).json({ error: 'Parameters are missing' });
  }

  try {
    let product_data = await sendRequest(sku,token);
    let p_name = product_data[0];
    let p_var = product_data[1];
    let p_price = "$"+ String(product_data[2]);
    let p_sku = product_data[3];
    let jsonData = [
      {"text": [5, 5, p_name, "fonts/bahnschrift20", 1]},
      {"text": [5, 35, p_var, "fonts/bahnschrift30", 1]},
      {"text": [160, 60, p_price, "fonts/calibrib80", 2]},
      {"text": [5, 80, p_sku, "fonts/libre28", 1]},
      
    ];
    // Convert object to JSON string
    let jsonString = JSON.stringify(jsonData, null, 2);
    // Write JSON data to a file
    fs.writeFile('output.json', jsonString, (err) => {
      if (err) {
        console.error('Error writing file:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      console.log('JSON file has been generated successfully');
      res.json(jsonData); // Return jsonData directly
    });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while processing the request' });
  }
});

app.listen(port, () => {
  console.log(`server started on port ${port}`);
});
