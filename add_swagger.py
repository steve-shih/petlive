import ast
import os
import sys

def add_swagger_to_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        source = f.read()

    tree = ast.parse(source)
    modifications = []

    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef):
            has_route = False
            route_path = ""
            route_methods = "['GET']"
            for decorator in node.decorator_list:
                if isinstance(decorator, ast.Call) and getattr(decorator.func, 'attr', '') == 'route':
                    has_route = True
                    if decorator.args and isinstance(decorator.args[0], ast.Constant):
                        route_path = decorator.args[0].value
                    for kwd in decorator.keywords:
                        if kwd.arg == 'methods' and isinstance(kwd.value, ast.List):
                            methods = [el.value for el in kwd.value.elts if isinstance(el, ast.Constant)]
                            route_methods = repr(methods)

            if has_route:
                # Check if already has docstring
                if ast.get_docstring(node):
                    continue

                # Generate a simple Swagger YAML docstring in Traditional Chinese
                docstring = f'''    """
    獲取或修改資料 API
    ---
    tags:
      - 系統 API
    summary: "{node.name} API"
    description: "這個 API 會執行 {node.name} 操作。"
    responses:
      200:
        description: 成功返回資料
        schema:
          type: object
      400:
        description: 請求參數錯誤
      500:
        description: 伺服器內部錯誤
    """\n'''
                
                # Find the line number of the def statement
                # We need to insert after the def line
                def_lineno = node.lineno
                modifications.append((def_lineno, docstring))

    if not modifications:
        return

    lines = source.split('\n')
    # Sort modifications descending to avoid shifting line numbers
    modifications.sort(key=lambda x: x[0], reverse=True)

    for lineno, docstring in modifications:
        lines.insert(lineno, docstring.strip('\n'))

    new_source = '\n'.join(lines)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_source)

if __name__ == "__main__":
    target_dir = sys.argv[1]
    for root, dirs, files in os.walk(target_dir):
        for file in files:
            if file.endswith('.py'):
                add_swagger_to_file(os.path.join(root, file))
