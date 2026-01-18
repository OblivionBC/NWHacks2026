import GraphVisualization from "./components/GraphVisulization";
import {useEffect, useState} from "react"
import "./VersionControlTimeline.css"

export default function VersionControlTimeline(props){
    const {chatId, onNodeClick, currentNodeId} = props
    const [treeData, setTreeData] = useState()
    const [collapseFlags, setCollapseFlags] = useState(false)

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
        <div className="version-control-header">
            <h1>Version Control graph</h1>
            <label className="toggle-switch">
                <input 
                    type="checkbox" 
                    checked={collapseFlags}
                    onChange={(e) => setCollapseFlags(e.target.checked)}
                />
                <span className="toggle-slider"></span>
                <span className="toggle-label">Collapse Flags</span>
            </label>
        </div>
        <GraphVisualization 
            data={treeData} 
            onNodeClick={onNodeClick} 
            currentNodeId={currentNodeId}
            collapseFlags={collapseFlags}
        />
    </>
    )
}