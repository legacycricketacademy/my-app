def plan_from_goal(goal:str):
    slug = goal
    return [{
        "title": slug,
        "acceptance": "Creates a tiny harmless change and opens a PR.",
        "steps": ["touch files to verify flow"],
        "files": ["client/src/agent-wiring.md", "server/agent-wiring.md"],
        "npmScripts": []
    }]
