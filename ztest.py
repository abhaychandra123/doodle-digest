from openai import OpenAI

# Define your OpenAI API key
API_KEY = "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"

# Initialize the OpenAI client
client = OpenAI(api_key=API_KEY)

# Generate an image using DALL-E
response = client.images.generate(
    model="dall-e-3",
    prompt="A highly detailed, photorealistic 8K resolution scene depicting a futuristic cyberpunk city at night with neon signs, flying vehicles, holographic advertisements, rain-soaked streets reflecting colorful lights, crowds of diverse people in elaborate futuristic clothing, towering skyscrapers with intricate architectural details, giant digital billboards, street vendors with exotic alien foods, robotic police officers, underground tunnels with glowing pipes, dense atmospheric fog, dramatic volumetric lighting, lens flares, and a massive moon visible through the smog in the background",
    size="1024x1024",
    quality="hd",
    n=1,
)
# Get the image URL
image_url = response.data[0].url
print(f"Generated image URL: {image_url}")