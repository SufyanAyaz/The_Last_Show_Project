import React, { useState, useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import FormattedDate from "./FormattedDate";
import { currentDate } from "./currentDate";

function Layout() {
    const navigate = useNavigate();

    const [count, setCount] = useState(0);
    const [obituaries, setObituaries] = useState([]);
    const [obituaries2, setObituaries2] = useState([]);

    const [name, setName] = useState("");
    const [born, setBorn] = useState("");
    const [death, setDeath] = useState("");
    const [file, setFile] = useState([]);

    useEffect(() => {
        const asyncFunc = async () => {
            if (obituaries2) {
                const res = await fetch("https://6zq5sbq4ud4iem33ndrt7qrxza0dsujc.lambda-url.ca-central-1.on.aws/",
                    {
                        headers: {
                            "Content-Type": "application/json",
                        }
                    });

                if (res.status == 200) {
                    const obituaries2 = await res.json();
                    setObituaries(obituaries2)
                    console.log(obituaries2);
                }
            };
        };
        asyncFunc();
    }, []);

    console.log(obituaries2);



    useEffect(() => {
        const storedObituaries = JSON.parse(localStorage.getItem("obituaries"));
        if (storedObituaries) {
            setObituaries(storedObituaries);
        }
    }, []);


    const onSubmitForm = async (e) => {
        e.preventDefault();
        const data = new FormData();
        data.append("file", file);
        data.append("name", name);
        data.append("born", born);
        data.append("death", death);
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const fileData = reader.result;
            const newObituary = { fileData, name, born, death };
            setObituaries([...obituaries, newObituary]);
        };

        return new Promise((resolve, reject) => {
            fetch(
                "https://zy75lb6zot6j344wnsgs5xjhfi0chsui.lambda-url.ca-central-1.on.aws/",
                {
                    method: "POST",
                    body: data
                }
            )
                .then(async (response) => {
                    if (response.ok) {
                        const responseBody = await response.json();
                        setObituaries([...obituaries, responseBody]);
                        console.log(responseBody);
                        resolve();
                    } else {
                        reject(new Error("Failed to upload obituary."));
                    }
                })
                .catch((error) => {
                    reject(error);
                });
        });
    };



    const onFileChange = (e) => {
        console.log(e.target.files);
        setFile(e.target.files[0]);
    }

    const display = () => {
        if (count === 0) {
            setCount(1)
        }
        else {
            setCount(0)
        }
    }


    const [obituaryStates, setObituaryStates] = useState([]);

    // useEffect(() => {
    //     // initialize the collapsed state for each obituary
    //     const states = obituaries.map(() => false);
    //     setObituaryStates(states);
    // }, [obituaries]);


    function Obituary({ obituary, index }) {
        const [collapsed, setCollapsed] = useState(true);

        return (
            <div className={`Obituarys ${!collapsed ? 'collapsed' : ''}`} key={index}>
                <img
                    className="ob-pic"
                    src={obituary.image}
                    alt={`Obituary ${index}`}
                    onClick={() => setCollapsed(!collapsed)}
                />
                <div className={`obituary-info ${!collapsed ? 'collapsed' : ''}`}>
                    <div className="ob-head">
                        <p className="name">{obituary.Name}</p>
                        <div className="dates">
                            {(<FormattedDate date={obituary.birth} />)} - {(<FormattedDate date={obituary.death} />)}
                        </div>
                    </div>
                    <p className="memoir">{obituary.memoir}</p>
                    <audio controls="controls">
                        <source src={obituary.audio} type="audio/mpeg" />
                    </audio>
                </div>
            </div>
        );
    }

    const obituaryList = obituaries.map((obituary, index) => (
        <Obituary obituary={obituary} index={index} key={index} />
    ));

    return (
        <>
            <header>
                <h1 className="title">The Last Show</h1>
                <div className="newButton">
                    <button type='button' className="addNew" onClick={() => { display(); navigate("/obituaries/create") }}>&#43;  New Obituary</button>
                </div>
            </header>

            <main className="obituaries">
                <div className="obituaryWrapper">
                    <Outlet context={[obituaryList, onSubmitForm, display, onFileChange, name, setName, born, setBorn, death, setDeath]} />
                </div>
            </main>
        </>
    )
}

export default Layout;