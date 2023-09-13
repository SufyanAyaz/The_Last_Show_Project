import { useNavigate, useOutletContext } from "react-router-dom";
import { useRef, useState } from "react";
import { currentDate } from "./currentDate";


function CreationDisplay() {
    const navigate = useNavigate();
    const [obituaryList, onSubmitForm, display, onFileChange, name, setName, born, setBorn, death, setDeath] = useOutletContext();
    setDeath(currentDate());


    const fileInput = useRef(null);
    const [labelText, setLabelText] = useState("Select an image for the deceased");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (e) => {
        const fileName = e.target.files[0].name;
        setLabelText(`Select an image for the deceased (${fileName})`);
        onFileChange(e);
    }

    const handleClick = (e) => {
        e.preventDefault();
        fileInput.current.click();
    };

    return (
        <div className="popUp">
            <div className="cancel"><button className="cancel" onClick={(e) => {
                e.stopPropagation();
                navigate("/obituaries")
            }}>&#x2715;</button></div>
            <form method="GET" className="form"
                onSubmit={async (e) => {
                    setIsSubmitting(true);
                    e.preventDefault();
                    try {
                        await onSubmitForm(e);
                        setIsSubmitting(false);
                        navigate("/obituaries");
                    } catch (error) {
                        console.error(error);
                    }
                }} >

                <div className="creation-head">
                    <h1 className="creation-title">Create A New Obituary</h1>
                    <img src="https://i.imgur.com/Ndxe1Qit.jpg" alt="border" className="creation-img"></img>
                </div>

                <div className="creation-elements">
                    <div className="file">

                        <label htmlFor="file-input" onClick={handleClick} className="file-inp">
                            {labelText}
                        </label>
                        <input
                            id="file-input"
                            type="file"
                            accept="image/*"
                            required
                            ref={fileInput}
                            style={{ display: "none" }}
                            onChange={handleInputChange}
                        />

                    </div>

                    <div className="name">
                        <input
                            type="text"
                            required
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Name of The Deceased"
                        ></input>
                    </div>

                    <div className="dates">
                        <div className="birth">
                            <label for="birth-date">Born: </label>
                            <input
                                id="birth-date"
                                type="datetime-local"
                                onChange={(e) => setBorn(e.target.value)}
                                required>
                            </input>
                        </div>

                        <div className="death">
                            <label for="death-date">Died: </label>
                            <input
                                id="death-date"
                                type="datetime-local"
                                value={currentDate()}
                                onChange={(e) => setDeath(e.target.value)}
                                required>
                            </input>
                        </div>
                    </div>

                    <input className={`${isSubmitting ? "submitting" : "notSubmitting"}`} type="submit" disabled={isSubmitting} value={`${isSubmitting ? "Please Wait. It's Not Like They're Going to be Late..." : "Write Obituary"}`} />
                </div>


            </form>
        </div>
    )
}

export default CreationDisplay;