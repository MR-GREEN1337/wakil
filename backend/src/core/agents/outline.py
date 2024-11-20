from langchain_core.output_parsers.json import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq


async def set_outline(data: dict[str, str]):
    possibilities = ["Chat", "Graph"]
    chat = ChatGroq(
        temperature=1,
        model_name="llama3-groq-70b-8192-tool-use-preview",
        api_key="",
    )
    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You are an expert on choosing AI Agent jobs based on their name and description, what you should do is select possible and doable jobs for the agent, the jobs will be given, what you shoud do is return possible jobs in form of JSON. Here is agent's name: {name} and description: {description}, here are potential agent jobs for that agent: {possibilities}. If no jobs seem suitable, select Chat, just return JSON and nothing else, my life depends on only returning the JSON and no text so i could parse it ",
            )
        ]
    ).partial(
        name=data["title"],
        description=data["description"],
        possibilities=", ".join(possibilities),
    )

    chain = prompt | chat | JsonOutputParser()
    result = await chain.ainvoke({"text": data["description"]})
    print(result)
    return result["jobs"]
