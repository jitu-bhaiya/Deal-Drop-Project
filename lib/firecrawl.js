import Firecrawl from '@mendable/firecrawl-js';

const firecrawl = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY});

export async function scrapeProduct(url) {
    try {
        const result = await firecrawl.scrape(url, {
            formats:[
                {
                    type: "json",
                    schema: {
                        type: "object",
                        required: [],
                        properties: {
                            productName: {
                                type: "string",
                            },
                            currentPrice: {
                                type: "string",
                            },
                            currencyCode: {
                                type: "string",
                            },                           
                            productImageUrl: {
                                type: "string",
                            },
                        },                   
                    },
                    prompt : 
                        "Extract the product name, current price, currency code and image url",
                },
            ],
        });

        console.log("FIRECRAWL RESPONSE:");
        console.log(JSON.stringify(result, null, 2));

        const extractedData = result.json;

        if (!extractedData || !extractedData.productName) {
            throw new Error("No data extracted from URL");
        }

        return extractedData;
    } catch (error) {
        console.error("Firecrawl scrape error:", error);
        throw new Error(`Failed to scrape product: ${error.message}`);
    }
    
}