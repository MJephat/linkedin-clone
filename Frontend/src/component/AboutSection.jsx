import { useState } from "react";

const AboutSection = ({userData, onSave,isOwnProfile}) => {
    const [isEditing, setISetEditing] = useState(false);
    const [about, setAbout] = useState(userData.about || "");

    const handleSave = () => {
        setISetEditing(false);
        onSave({about})
    }
  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">About</h2>
        {isOwnProfile && (
            <>
            {isEditing ? (
                <>
                <textarea
                className="w-full border rounded p-2"
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                rows='4'
                />
                <button 
                onClick={handleSave}
                className="mt-2 bg-primary text-white py-2 px-4 rounded hover:bg-primary-dark transition duration-300"
                >
                    Save
                </button>
            </>
            ):(
                <>
                <p>{userData.about}</p>
                <button 
                onClick={()=>setISetEditing(true)}
                className="mt-2 text-primary hover:text-primary-dark transition duration-300"
                >
                    Edit
                </button>
            </>
            )}
            </>
        )}
    </div>
  )
}

export default AboutSection
