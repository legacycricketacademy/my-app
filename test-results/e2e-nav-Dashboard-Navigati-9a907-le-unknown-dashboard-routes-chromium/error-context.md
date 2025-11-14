# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - heading "Legacy Cricket Academy" [level=3] [ref=e6]
      - paragraph [ref=e7]: Development Login
    - generic [ref=e8]:
      - generic [ref=e9]:
        - generic [ref=e10]:
          - text: Email
          - textbox "Email" [ref=e11]:
            - /placeholder: Enter your email
            - text: admin@test.com
        - generic [ref=e12]:
          - text: Password
          - textbox "Password" [ref=e13]:
            - /placeholder: Enter your password
            - text: Test1234!
        - button "Sign In" [active] [ref=e14] [cursor=pointer]
      - generic [ref=e15]:
        - heading "Development Accounts" [level=3] [ref=e16]
        - generic [ref=e17]:
          - generic [ref=e18]:
            - generic [ref=e19]: parent@test.com
            - button "Use" [ref=e20] [cursor=pointer]
          - generic [ref=e21]:
            - generic [ref=e22]: admin@test.com
            - button "Use" [ref=e23] [cursor=pointer]
  - region "Notifications (F8)":
    - list
  - region "Notifications (F8)":
    - list
```