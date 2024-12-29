import { sendConnectionAcceptedEmail } from "../emails/emailHanlers.js";
import { sender } from "../lib/mailtrap.js";
import ConnectionRequest from "../models/connectionRequest.model.js";
import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";

export const sendConnectionRequest = async (req, res) => {
    try {
        const {userId} = req.body;
        const senderId = req.user._id;

        if (senderId.toString() === userId){
            return res.status(400).json({message: "You cannot send a connection request to yourself"});
        }

        if (req.user.connections.includes(userId)){
            return res.status(400).json({message: "You already connected"});
        }

        const exixtingRequest = await ConnectionRequest.findOne({
            sender: senderId,
            recipient: userId,
            status: "pending",
        });
        
        if (exixtingRequest){
            return res.status(400).json({message: "You already sent a connection request"});
        }

        const newRequest = new ConnectionRequest({
            sender: senderId,
            recipient: userId,
        });

        await newRequest.save();
        res.status(200).json({message: "Connection request sent successfully"});

    } catch (error) {
        res.status(500).json({message: "Server error"})
    }
};

export const acceptConnectionRequest = async (req, res)=>{
    try {
        const { requestId } = req.params;
        const userId = req.user._id;

        const request = await ConnectionRequest.findById(requestId)
        .populate("sender", "name email profilePicture")
        .populate("recipient", "name username ");

        if(!request){
            return res.status(404).json({message: "Connection request not found"});
        }

        // check if the current user is the recipient of the request
        if (request.recipient._id.toSting() !== userId.toString()){
            return res.status(403).json({message: "You are not authorized to accept this request"});
        }

        if (request.status !== "pending"){
            return res.status(400).json({message: "This request has already been processed"});
        }

        request.status = "accepted";
        await request.save();

        // if i am your friend then ur my friend
        await User.findByIdAndUpdate(request.sender._id, { $addToSet: { connections: userId } });
        await User.findByIdAndUpdate(userId, { $addToSet: { connections: request.sender._id } });

        // create a notification for the sender
        const notification = new Notification({
            recipient: request.sender._id,
            type: "connectionAccepted",
            relatedUser: userId,
        });
        await notification.save();

        res.status(200).json({message: "Connection request accepted successfully"});
        // todo 05: send notification email
        const senderEmail = request.sender.email;
        const senderName = request.sender.name;
        const recipientName = request.recipient.name;
        const profileUrl = process.env.CLIENT_URL + "/profile/" + request.recipient.username;

        try {
            await sendConnectionAcceptedEmail(senderEmail, senderName, recipientName, profileUrl);
        } catch (error) {
            console.log("Error in sending email notification:", error)
        }

    } catch (error) {
        console.log("Error in acceptConnectionRequest controller:", error);
        res.status(500).json({message: "Server error"})
    }
}

export const rejectConnectionRequest = async (req, res)=>{
    try {
        const { requestId } = req.params;
        const userId = req.user._id;

        const request = await ConnectionRequest.findById(requestId);

        if(request.recipient.toString() !== userId.toString()){
            return res.status(403).json({message: "You are not authorized to reject this request"});
        }

        if (request.status !== "pending"){
            return res.status(400).json({message: "This request has already been processed"});
        }

        request.status = "rejected";
        await request.save();

        res.status(200).json({message: "Connection request rejected successfully"});
    } catch (error) {
        console.log("Error in rejectConnectionRequest controller:", error);
        res.status(500).json({message: "Server error"})
    }
    
}

export const getConnectionRequests = async (req, res)=>{
    try {
        const userId = req.user._id;

        const requests = await ConnectionRequest.find({recipient: userId, status: "pending"})
        .populate("sender", "name username profilePicture headline connections");

        res.status(200).json(requests);
    } catch (error) {
        console.log("Error in getConnectionRequests controller:", error);
        res.status(500).json({message: "Server error"})
    }
}

export const getUserConnections = async (req, res)=>{
    try {
        const userId = req.user._id;

        const user = await User.findById(userId).populate("connections", "name username profilePicture headline");

        res.status(200).json(user.connections);
    } catch (error) {
        console.log("Error in getUserConnections controller:", error);
        res.status(500).json({message: "Server error"});
    }
}

export const removeConnection = async (req, res)=>{
    try {
        const myId = req.user._id;
        const { userId } = req.params;

        // if you are not my friend i am not your friend
        await User.findByIdAndUpdate(myId, {$pull: {connections: userId}});
        await User.findByIdAndUpdate(userId, {$pull: {connections: myId}});

        res.status(200).json({message: "Connection removed successfully"});

    } catch (error) {
        console.log("Error in removeConnection controller:", error);
        res.status(500).json({message: "Server error"})
    }
}

export const getConnectionStatus = async (req, res)=>{
    try {
        const targetUserId = req.params.userId;
        const currentUserId = req.user._id;

        const currentUser = req.user;
        if(currentUser.connections.includes(targetUserId)){
            return res.status(200).json({status: "connected"});
        }

        const pendingRequest = await ConnectionRequest.findOne({
            $or:[
                {sender: currentUserId, recipient: targetUserId,},
                {sender: targetUserId, recipient: currentUserId,}
            ],
            status: "pending",
        })

        if(pendingRequest){
            if(pendingRequest.sender.toString() === currentUserId.toString()){
                return res.json({status: "pending"});
            }else{
                return res.json({status: "recieved", requestId: pendingRequest._id});
            }
        }

        // if no connection or pending req found
        res.json({status: "not connected"});
        
    } catch (error) {
        console.log("Error in getConnectionStatus controller:", error);
        res.status(500).json({message: "Server error"})
    }
}
