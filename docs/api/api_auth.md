# API Authentication Documentation

## Authentication Method

### Access Token

For API interfaces that require authentication, the following two request headers must be provided simultaneously for Access Token authentication:

1.  **`Authorization` field in the request header**

    Place the Access Token in the `Authorization` field of the HTTP request header, in the following format:

    ```
    Authorization: <your_access_token>
    ```

    Where `<your_access_token>` needs to be replaced with the actual Access Token value.

2.  **`New-Api-User` field in the request header**

    Place the user ID in the `New-Api-User` field of the HTTP request header, in the following format:

    ```
    New-Api-User: <your_user_id>
    ```

    Where `<your_user_id>` needs to be replaced with the actual user ID.

**Note:**

*   **Both `Authorization` and `New-Api-User` request headers must be provided to pass authentication.**
*   If only one of the request headers is provided, or if neither is provided, a `401 Unauthorized` error will be returned.
*   If the Access Token in `Authorization` is invalid, a `401 Unauthorized` error will be returned with the message "Permission denied, access token is invalid".
*   If the user ID in `New-Api-User` does not match the Access Token, a `401 Unauthorized` error will be returned with the message "Permission denied, does not match the logged-in user, please log in again".
*   If the `New-Api-User` request header is not provided, a `401 Unauthorized` error will be returned with the message "Permission denied, New-Api-User not provided".
*   If the `New-Api-User` request header format is incorrect, a `401 Unauthorized` error will be returned with the message "Permission denied, New-Api-User format is incorrect".
*   If the user has been disabled, a `403 Forbidden` error will be returned with the message "User has been banned".
*   If the user's permissions are insufficient, a `403 Forbidden` error will be returned with the message "Permission denied, insufficient permissions".
*   If the user information is invalid, a `403 Forbidden` error will be returned with the message "Permission denied, user information is invalid".

## Curl Example

Assuming your Access Token is `access_token`, your user ID is `123`, and the API interface to be accessed is `/api/user/self`, you can use the following curl command:

```bash
curl -X GET \
  -H "Authorization: access_token" \
  -H "New-Api-User: 123" \
  https://your-domain.com/api/user/self
```

Please replace `access_token`, `123`, and `https://your-domain.com` with the actual values.
