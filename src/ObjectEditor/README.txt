Structure
=========

+---------------------------+
|                           |
|  [index.js]               |
|                           |
|    +                      |
|    |                      |
|    | renders              |                                   +-------------------------+
|    |                      |        uses                       |                         |
|    v               +--------------------------------------->  | [ObjectEditorField.jsx] |
|                    |      |                                   |                         |
| * Title            |      |    +-------------------------+    |                         |
| * Form Elements  +-+     uses  |                         |    |                         |
|   * DebitsCreditsEditor +----->|[DebitsCreditsEditor.jsx]|    |                         |
|   * All other fields      |    |                         |    |                         |
| * Custom Property Editor  |    |                         |    |                         |
| * Action Buttons          |    |                         |    |                         |
| * (also holds the         |    |                         |uses|                         |
|  account selection modal) |    |                      +--------->                       |
|                           |    |                         |    |                         |
+---------------------------+    +-------------------------+    +-------------------------+
