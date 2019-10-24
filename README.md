# React Native Foreground Service Demo

This a demo project for [react-native-foreground-service](https://github.com/voximplant/react-native-foreground-service) module.
`react-native-foregroun-service` library allows to stat and stop foreground service on Android platform.

## Build and run application (Android only)
1. Clone the project
2. Run `yarn install` command in the terminal
3. Build and run [splurt-server](https://github.com/marcocastignoli/splurt-server)
4. Run `yarn start` in the terminal
5. Run `yarn run-android` in another terminal instance

## Config & Usage
1. Register a `user` to splurt-server by pushing to users collection in the db
```json
{
    "name": "<user_name>",
    "pwd": "<user_password>"
}
```
2. Register a `service` to splurt-server by pushing it to services collection in the db
```json
{
    "name": "<service_name>",
    "pwd": "<service_password>"
}
```
3. Login the user via phone
4. Define the following environment variables (enter each line separately)
```bash
service_name="<service_name>"
service_password="<service_password>"
http_port="8888"
user_id="<logged user's _id property from db>"
```
5. Login the service to receive a `service_jwt` by running this command
```bash
service_jwt=$(curl -d "{\"name\":\"$service_name\", \"pwd\":\"$service_password\"}"\
                   -H "Content-Type: application/json"\
                   -X POST "http://localhost:$http_port/services/login")
```
6. Push service notification `message` to a user by making a user request to a `user_id` 
```bash
echo $(curl -X POST "http://localhost:$http_port/push/$user_id"\
            -H "Authorization: Bearer $service_jwt"\
            -H "Content-Type: application/json"\
            -d '{ "title": "message" }')
```

## References
- user: client account that would receive notifications
- service: service that would be sending notifications
- service_jwt: JSON web token used for service authentication to be able to send notifications
- http_port: port that was setup in the splurt server (default is 8888)
- user_id: id of the user inside the users collection
- message: string to be pushed as notification to user

## Licence 
MIT
