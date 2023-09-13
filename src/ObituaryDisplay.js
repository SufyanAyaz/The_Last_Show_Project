import React from "react";
import { useOutletContext } from "react-router-dom";

function ObituaryDisplay() {
    const [obituaryList, onSubmitForm, display, onFileChange, name, setName, born, setBorn, death, setDeath] = useOutletContext();
    return <>
        <div className="ob-display">
            {obituaryList.length === 0 ? <div className="empty-obituary-container">No Obituaries Have Been Added Yet</div> : obituaryList}
        </div>
    </>
}

export default ObituaryDisplay;