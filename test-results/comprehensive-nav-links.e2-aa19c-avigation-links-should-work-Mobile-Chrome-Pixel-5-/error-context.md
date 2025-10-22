# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - heading "Sign in to Legacy Cricket Academy" [level=1] [ref=e4]
    - form "login-form" [ref=e5]:
      - text: Email
      - textbox "Email" [ref=e6]
      - text: Password
      - textbox "Password" [ref=e7]
      - button "Login" [ref=e8] [cursor=pointer]
    - generic [ref=e9]:
      - text: Don't have an account?
      - link "Register" [ref=e10] [cursor=pointer]:
        - /url: /register
  - region "Notifications (F8)":
    - list
  - region "Notifications alt+T"
  - region "Notifications (F8)":
    - list
```