import os
import json
import asyncio
import requests
from google.adk.tools import BaseTool

class WebSearchTool(BaseTool):
    def __init__(self):
        super().__init__(
            name="WebSearchTool",
            description="Performs a web search using an external API and returns top results as JSON.",
        )
        # Retrieve API key and endpoint from environment variables
        self.search_api_key = os.getenv("SEARCH_API_KEY")
        self.search_api_endpoint = os.getenv("SEARCH_API_ENDPOINT", "YOUR_SEARCH_API_ENDPOINT")

        if not self.search_api_key:
            print("Warning: SEARCH_API_KEY environment variable not set for WebSearchTool.")
        if self.search_api_endpoint == "YOUR_SEARCH_API_ENDPOINT":
            print("Warning: SEARCH_API_ENDPOINT environment variable not set for WebSearchTool. Using placeholder.")

    async def _execute(self, query: str, num_results: int = 5) -> str:
        """Performs a web search and returns formatted results."""
        if not self.search_api_key:
            return json.dumps({"error": "Search API key not configured."})
        if self.search_api_endpoint == "YOUR_SEARCH_API_ENDPOINT":
            return json.dumps({"error": "Search API endpoint not configured."})
        if not query:
            return json.dumps({"error": "No search query provided."})

        print(f"WebSearchTool: Searching for '{query}' (limit {num_results})")
        try:
            # Example using requests library (sync, wrap in async)
            headers = {
                "Authorization": f"Bearer {self.search_api_key}",
                "Content-Type": "application/json"
            }
            params = {
                "q": query,
                "num": num_results
            }

            # Using requests synchronously wrapped in asyncio.to_thread.
            response = await asyncio.to_thread(
                requests.get, self.search_api_endpoint, headers=headers, params=params, timeout=10
            )

            response.raise_for_status()
            results = response.json()

            # Parse results based on API structure
            items_list = results.get("items") or results.get("results", [])
            formatted_results = [
                {
                    "title": item.get("title", "No Title"),
                    "url": item.get("link") or item.get("url"),
                    "snippet": item.get("snippet", "No Snippet"),
                    "description": item.get("snippet", "No description available.")
                }
                for item in items_list[:num_results]
                if (item.get("link") or item.get("url"))
            ]

            print(f"WebSearchTool: Found {len(formatted_results)} results for '{query}'")
            return json.dumps(formatted_results)

        except requests.exceptions.Timeout:
            error_msg = f"Web search request timed out after 10 seconds."
            print(f"Error in WebSearchTool: {error_msg}")
            return json.dumps({"error": error_msg})
        except requests.exceptions.RequestException as e:
            error_msg = f"Web search request failed: {str(e)}"
            print(f"Error in WebSearchTool: {error_msg}")
            return json.dumps({"error": error_msg})
        except json.JSONDecodeError as e:
            error_msg = f"Failed to parse search API response: {str(e)}"
            print(f"Error in WebSearchTool: {error_msg}")
            return json.dumps({"error": error_msg})
        except Exception as e:
            error_msg = f"An unexpected error occurred during web search: {str(e)}"
            print(f"Error in WebSearchTool: {error_msg}")
            return json.dumps({"error": error_msg})
