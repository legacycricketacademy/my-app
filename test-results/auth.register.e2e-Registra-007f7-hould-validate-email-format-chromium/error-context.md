# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - heading "Register" [level=1] [ref=e4]
    - generic [ref=e5]:
      - combobox [ref=e6]:
        - option "Parent" [selected]
        - option "Coach"
      - textbox "Parent/Coach name" [ref=e7]: Test Parent
      - textbox "Email" [active] [ref=e8]: invalid-email
      - textbox "Phone" [ref=e9]
      - textbox "Child name" [ref=e10]
      - combobox [ref=e11]:
        - option "U7"
        - option "U11" [selected]
        - option "U13"
        - option "U15"
      - button "Submit" [ref=e12] [cursor=pointer]
  - region "Notifications (F8)":
    - list
  - region "Notifications (F8)":
    - list
```