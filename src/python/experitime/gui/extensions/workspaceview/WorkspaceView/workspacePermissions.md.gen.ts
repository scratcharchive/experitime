const text: string = "[//]: # \"This file was automatically generated by jinjaroot. Do not edit directly.\"\nYou can set permissions for this workspace by running a Python script on the computer where the backend provider is running.\n\nTo allow a user to edit this workspace:\n\n```python\nimport experitime\n\nexperitime.set_user_workspace_permissions(\n    user_id='user@gmail.com',\n    workspace_uri='{workspaceUri}',\n    append=True\n)\n```\n"

export default text