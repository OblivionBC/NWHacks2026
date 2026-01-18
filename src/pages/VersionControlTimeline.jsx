import GraphVisualization from "./components/GraphVisulization";
import {useEffect, useState} from "react"

export default function VersionControlTimeline(props){
    const {chatId, onNodeClick, currentNodeId} = props
    const [treeData, setTreeData] = useState()

    const fetchData = async (chatId) =>{
        if(chatId){}
        const data = await fetch(`http://localhost:3001/api/chats/${chatId}/nodes`, {
            method: 'GET', 
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        const json = await data.json();
        console.log(json);
        setTreeData(json)

  }

    useEffect(() => {
        if(chatId){
            fetchData(chatId)
        }
    }, [chatId]);

    return(
    <>
        <h1>Version Control graph</h1>
        <GraphVisualization data={treeData} onNodeClick={onNodeClick} currentNodeId={currentNodeId}/>
    </>
    )
}