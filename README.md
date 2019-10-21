# React Native Foreground Service Demo

This a demo project for [react-native-foreground-service](https://github.com/voximplant/react-native-foreground-service) module.
`react-native-foregroun-service` library allows to stat and stop foreground service on Android platform.

## Build and run application (Android only)
1. Clone the project
2. Run `yarn install` command in the Terminal
3. Run `react-native run-android` in the Terminal

## Config & Usage
1. Register a `user` to splurt-server by pushing to users collection in the db
```json
{
    "name": "user_name",
    "pwd": "user_password"
}
```
2. Register a `service` to splurt-server by pushing it to services collection in the db
```json
{
    "name": "service_name",
    "pwd": "service_password"
}
```
3. Login the service to receive a `service_jwt` by making this POST request taking note of `http_port`
```bash
curl -d '{"name":"service_name", "pwd":"service_password"}'\
     -H "Content-Type: application/json"\
     -X POST http://localhost:http_port/services/login
```
4. Push service notification `message` to a user by making a user request to a `user_id` 
```bash
curl -X POST http://localhost:http_port/push/user_id\
     -H "Authorization: Bearer  service_jwt"\
     -H "Content-Type: application/json"\
     -d '{ "title": "message" }'
```

## References
- user: client account that would receive notifications
- service: service that would be sending notifications
- service_jwt: JSON web token used for service authentication to be able to send notifications
- http_port: port that was setup in the splurt server
- user_id: id of the user inside the users collection
- message: string to be pushed as notification to user

## Licence 
MIT
