# API Documentation

## Events

- ### REQUIRE_CONTEXT

```
SHELL_EVENTS.Version1.REQUIRE_CONTEXT
```

Must be sent on application startup to get initial application context from the shell

- Request payload

  type: object

  ```typescript
  {
    clientIdentifier: string;
    clientSecret: string;
    cloudStorageKeys?: CloudStorageKey[];
    auth?: {
      response_type: 'token'
    }
  }
  ```

* Response payload

  type: object

  ```typescript
  {
    authToken?: string;
    cloudHost: string;
    account: string;
    accountId: string;
    company: string;
    companyId: string;
    selectedLocale: string;
    user: string;
    userId: string;
    userAccountFeatureFlagsEnabled: boolean;
    userAccountFeatureFlagsUserId: string;
    erpType: string;
    erpUserId: string;
    auth?: {
      access_token: string,
      token_type: string,
      expires_in: number
    }
  }
  ```

  The property `authToken` can only be accessed by applications and will not be exposed to extensions. Extensions should require an access_token using the auth value. _Also see [REQUIRE_AUTHENTICATION](#REQUIRE_AUTHENTICATION) event_

  REQUIRE_CONTEXT will first return the response payload, then trigger individual ViewState object as describe in the ViewState section.

- ### REQUIRE_AUTHENTICATION

```
SHELL_EVENTS.Version1.REQUIRE_AUTHENTICATION
```

Request restricted token for using by an extension

- Request payload

  type: object

  ```typescript
  {
    response_type: 'token';
  }
  ```

* Response payload

  type: object

  ```typescript
  {
    access_token: string,
    token_type: string,
    expires_in: number
  }
  ```

- ### GET_PERMISSIONS

<!-- tabs:start -->

#### **Version 2**

```
SHELL_EVENTS.Version2.GET_PERMISSIONS
```

Request permissions for specified object from the shell

- Request payload

  type: PermissionRequest

  ```typescript
  {
    objectName: string;
    owners?: string[];
  }
  ```

- Response payload

  type: PermissionResponse

  ```typescript
  {
    objectName: string;
    owners?: string[];
    permission: {
      CREATE: boolean;
      READ: boolean;
      UPDATE: boolean;
      DELETE: boolean;
      UI_PERMISSIONS: number[];
    };
  }

  ```

#### **Version 1 (deprecated)**

```
SHELL_EVENTS.Version1.GET_PERMISSIONS
```

Request permissions for specified object from the shell

- Request payload

  type: PermissionRequest

  ```typescript
  {
    objectName: string;
    owners?: string[];
  }
  ```

- Response payload

  type: Permission

  ```typescript
  {
    CREATE: boolean;
    READ: boolean;
    UPDATE: boolean;
    DELETE: boolean;
    UI_PERMISSIONS: number[];
  }
  ```

<!-- tabs:end -->

- ### GET_SETTINGS

  ```
  SHELL_EVENTS.Version1.GET_SETTINGS
  ```

  Request settings value for specific key from the shell

  - Request payload

    type: string  
    Key to read settings from

  - Response payload

    type: SettingsResponse\<T\>  
    settings value which was read from requested key

    ```typescript
    {
      key: string;
      value: T;
    }
    ```

  - Listenner

    ```typescript
    sdk.on(SHELL_EVENTS.Version2.GET_STORAGE_ITEM, (value) => {
      console.log(`item is now ${value}`);
    });
    ```

- ### GET_STORAGE_ITEM

<!-- tabs:start -->

#### **Version 2**

```
SHELL_EVENTS.Version2.GET_STORAGE_ITEM
```

Request value stored under specified key in cloud storage

- Request payload

  type: string  
  Key to read value from

- Response payload

  type: GetItemResponse\<T\>  
  object containing key name and value which was read from requested key

  ```typescript
  {
    key: string;
    value: T;
  }
  ```

- Listenner

  ```typescript
  sdk.on(SHELL_EVENTS.Version2.GET_STORAGE_ITEM, (response) => {
    console.log(`${response.key} is now ${response.value}`);
  });
  ```

#### **Version 1 (deprecated)**

```
SHELL_EVENTS.Version1.GET_STORAGE_ITEM
```

Request value stored under specified key in cloud storage

- Request payload

  type: string  
  Key to read value from

- Response payload
  ```typescript
  {
    value: T;
  }
  ```

<!-- tabs:end -->

- ### SET_STORAGE_ITEM

  ```
  SHELL_EVENTS.Version1.SET_STORAGE_ITEM
  ```

  Save value in cloud staorage under specified key

  - Request payload

    type: SetItemRequest\<T\>  
    object containing key name and value to store under that key

    ```typescript
    {
      key: string;
      value: T;
    }
    ```

  - Response payload

    type: boolean
    flag indicating if value was saved successfully

- ### GET_FEATURE_FLAG

  ```
  SHELL_EVENTS.Version1.GET_FEATURE_FLAG
  ```

  Request feature flag value from shell host

- Request payload

  type: GetFeatureFlagRequest  
  object containing key name and default value for feature flag to get

  ```typescript
  {
    key: string;
    defaultValue: boolean;
  }
  ```

- Response payload

  type: GetFeatureFlagResponse  
  object containing key name and value for feature flag

  ```typescript
  {
    key: string;
    value: boolean;
  }
  ```

- Listenner

  ```typescript
  sdk.on(SHELL_EVENTS.Version1.GET_FEATURE_FLAG, (response) => {
    console.log(`${response.key} is now ${response.value}`);
  });
  ```

- ### SET_TITLE

  ```
  SHELL_EVENTS.Version1.SET_TITLE
  ```

  Set title of the shell browser window to value provided in payload.
  Previous title will be internally stored in the shell host application.

  - Request payload

    type: SetTitleRequest  
    object containing `title` key which holds value to set title to

    ```typescript
    {
      title: string;
    }
    ```

  - No response will be sent

- ### RESTORE_TITLE

  ```
  SHELL_EVENTS.Version1.RESTORE_TITLE
  ```

  Restore document title to the value internally stored during previous SET_TITLE 
  event handling. If no stored title found, handling this event will do nothing.

  - No request payload need to be provided

  - No response will be sent

## Extension specific events

ShellSdk provide a set of features which are specifically designed to allow communications with extensions running inside an application.

- ### VIEW STATE

  View State event provide a shared context between all local instance.

  As you might need to share between your application and extensions a general context to provide consistent UI, ShellSdk let applications share any `{ key: value }` object through the ViewState entity. You can update the using the `setViewState(key, value)` method. ViewState is not persistent and will be deleted when user navigate outside of the application. ViewState is not allowed to use in an extension for security reason, and will throw generic error object.

  ```typescript
  this.sdk.setViewState('TECHNICIAN', id);
  ```

  To listen on modification event, use the listenner `onViewState` with the expected key.

  ```typescript
  this.sdk.onViewState('TECHNICIAN', id => {
      this.selectedId = id;
  }))
  ```

  To initialise your ViewState, make sure all `.onViewState` listenners are initialise when first emitting the `REQUEST_CONTEXT` event. ShellSdk will first trigger `.on(SHELL_EVENTS.Version1.REQUEST_CONTEXT` to initialize the general context, then individually receive events on `onViewState` listenners.

- ### TO_APP

  ```
  SHELL_EVENTS.Version1.TO_APP
  ```

  You can send any data from any extension to the main application using the `TO_APP` event.

  ```
  this.sdk.emit(SHELL_EVENTS.Version1.TO_APP, {
      message: 'test'
  });
  ```

  To listen in application, use the generic `on` method.

  ```typescript
  this.sdk.on(SHELL_EVENTS.Version1.TO_APP, (content) => {
    console.log(content.message); // print test in console
  });
  ```

## Generic events

- ### ERROR

  Will be emitted in response to any of request events in case if error occurs during handling the event.

  ```typescript
  shellSdk.on(SHELL_EVENTS.ERROR, (error) => {});
  ```
