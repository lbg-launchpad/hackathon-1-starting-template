import os
from typing import Any, Dict, List, Optional
from urllib.parse import quote_plus


class AzureOAuthHelper:
	"""Microsoft Entra ID (Azure AD) OAuth helper for web sign-in.

	Environment variables used by default:
	- AZURE_TENANT_ID
	- AZURE_CLIENT_ID
	- AZURE_CLIENT_SECRET
	- AZURE_REDIRECT_URI
	"""

	def __init__(
		self,
		tenant_id: Optional[str] = None,
		client_id: Optional[str] = None,
		client_secret: Optional[str] = None,
		redirect_uri: Optional[str] = None,
		scopes: Optional[List[str]] = None,
	) -> None:
		try:
			import msal  # type: ignore
		except ImportError as exc:
			raise ImportError(
				"The 'msal' package is required. Install it with: pip install msal"
			) from exc

		self.tenant_id = tenant_id or os.getenv("AZURE_TENANT_ID")
		self.client_id = client_id or os.getenv("AZURE_CLIENT_ID")
		self.client_secret = client_secret or os.getenv("AZURE_CLIENT_SECRET")
		self.redirect_uri = redirect_uri or os.getenv("AZURE_REDIRECT_URI")
		self.scopes = scopes or ["openid", "profile", "email", "User.Read"]

		missing = [
			name
			for name, value in {
				"AZURE_TENANT_ID": self.tenant_id,
				"AZURE_CLIENT_ID": self.client_id,
				"AZURE_CLIENT_SECRET": self.client_secret,
				"AZURE_REDIRECT_URI": self.redirect_uri,
			}.items()
			if not value
		]
		if missing:
			raise ValueError(
				"Missing Azure OAuth configuration: " + ", ".join(missing)
			)

		self.authority = f"https://login.microsoftonline.com/{self.tenant_id}"
		self._app = msal.ConfidentialClientApplication(
			client_id=self.client_id,
			client_credential=self.client_secret,
			authority=self.authority,
		)

	def create_auth_url(self, state: Optional[str] = None) -> str:
		"""Build the Microsoft sign-in URL.

		Pass a random `state` and store it in user session to prevent CSRF.
		"""
		return self._app.get_authorization_request_url(
			scopes=self.scopes,
			redirect_uri=self.redirect_uri,
			state=state,
			prompt="select_account",
		)

	def exchange_code_for_token(self, auth_code: str) -> Dict[str, Any]:
		"""Exchange the OAuth authorization code for access/id tokens."""
		token_result = self._app.acquire_token_by_authorization_code(
			code=auth_code,
			scopes=self.scopes,
			redirect_uri=self.redirect_uri,
		)

		if "error" in token_result:
			error = token_result.get("error")
			error_description = token_result.get("error_description", "")
			raise RuntimeError(f"Azure token exchange failed: {error} - {error_description}")

		return token_result

	@staticmethod
	def get_user_from_token(token_result: Dict[str, Any]) -> Dict[str, Any]:
		"""Extract normalized user info from MSAL token response."""
		claims = token_result.get("id_token_claims", {})
		return {
			"name": claims.get("name"),
			"email": claims.get("preferred_username") or claims.get("email"),
			"oid": claims.get("oid"),
			"tenant_id": claims.get("tid"),
			"raw_claims": claims,
		}

	def build_logout_url(self, post_logout_redirect_uri: str) -> str:
		"""Build the Microsoft logout URL for single sign-out."""
		return (
			f"{self.authority}/oauth2/v2.0/logout"
			f"?post_logout_redirect_uri={quote_plus(post_logout_redirect_uri)}"
		)
