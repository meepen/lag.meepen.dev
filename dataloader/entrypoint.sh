#!/usr/bin/env sh

# Check required environment variables
REQUIRED_VARS="TARGET_ADDRESS API_SECRET API_BASE_URL"
for var in $REQUIRED_VARS; do
  if [ -z "$(eval echo \$$var)" ]; then
    echo "$var environment variable not set. Exiting."
    exit 1
  fi
done

while true; do
  echo "Running mtr against $TARGET_ADDRESS for 10 seconds..."
  
  # Run mtr and capture JSON output, ensuring we only get JSON
  mtr_output=$(mtr -j -n -c 5 "$TARGET_ADDRESS")
  
  # Check if mtr command was successful and output is not empty
  if [ $? -ne 0 ] || [ -z "$mtr_output" ]; then
    echo "MTR command failed with exit code $?"
    continue
  fi
  
  echo "MTR completed successfully. Sending data to API..."
  
  # Debug: show first 100 characters of output
  echo "First 100 chars of MTR output: $(echo "$mtr_output" | head -c 100)..."
  
  # Send the mtr output to the API endpoint
  curl_response=$(curl -s -w "%{http_code}" \
    -X PUT \
    -H "Content-Type: application/json" \
    -H "Authorization: $API_SECRET" \
    -d "$mtr_output" \
    "$API_BASE_URL/dataloader/mtr-result")
  
  # Extract HTTP status code (last 3 characters)
  http_code="${curl_response: -3}"
  response_body="${curl_response%???}"
  
  if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
    echo "Successfully sent MTR data to API (HTTP $http_code)"
    echo "Response: $response_body"
  else
    echo "Failed to send MTR data to API (HTTP $http_code)"
    echo "Response: $response_body"
    echo "JSON data sent:"
    echo "$mtr_output"
  fi
done
