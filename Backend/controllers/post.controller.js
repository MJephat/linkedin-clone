import { sendCommentNotificationEmail } from "../emails/emailHanlers.js";
import cloudinary from "../lib/cloudinary.js";
import Notification from "../models/notification.model.js";
import Post from "../models/post.model.js";

export const getFeedPosts = async (req,res)=>{
    try {
        const posts = await Post.find({author: {$in: [...req.user.connections, req.user._id]}})
        .populate("author", "name username profilePicture headline")
        .populate("comments.user", "name profilePicture")
        .sort({ createdAt: -1});

        res.status(200).json(posts);
    } catch (error) {
        console.error("Error in getFeedPosts controller:", error);
        res.status(500).json({message: "Server error"})
    }
};

export const createPost = async (req,res)=>{
    try {
        const {content, image} = req.body;

        let newPost;

        if(image){
            const imgResult = await cloudinary.uploader.upload(image)
            newPost = new Post({
                author:req.user._id,
                content,
                image:imgResult.secure_url
            });
        }else{
            newPost = new Post({
                author:req.user._id,
                content
            })
        }
        await newPost.save();

        res.status(201).json(newPost);

    } catch (error) {
        console.error("Error in createPost controller:", error);
        res.status(500).json({message: "Server error"})
        
    }
}

export const deletePost = async (req, res)=>{
    try {
        const postId = req.params.id;
        const userId = req.user._id;

        const post = await Post.findById(postId);

        if(!post){
            return res.status(404).json({ message: "Post not found" });
        }

        // check if the curren user is the author of the post
        if(post.author.toString() !== userId.toString()){
            return res.status(403).json({message: "You are not authorized to delete this post"})
        }

        if(post.image){
            //todo 03: delete image from cloudinary>>(done)
            // deletes the image from cloudinary as well to save on space.
            await cloudinary.uploader.destroy(post.image.split("/").pop().split(".")[0]);
        }

        await Post.findByIdAndDelete(postId)

        res.status(200).json({message: "Post deleted successifully"})
        
    } catch (error) {
        console.log("Error in delete Post controller:", error);
        res.status(500).json({message: "Server error"})
    }
}

export const getPostById = async (req, res)=>{
    try {
        const postId = req.params.id;
        const post = await Post.findById(postId)
        .populate("author", "name username profilePicture headline")
        .populate("comments.user", "name profilePicture username headline");
        
    } catch (error) {
        console.log("Error in getPostById controller:", error);
        res.status(500).json({message: "Server error"})
    }
}

export const createComment = async (req, res)=>{
    try {
        const postId = req.params.id;
        const { content } = req.body;

        const post = await Post.findByIdAndUpdate(
            postId, 
            {
            $push:{comments: {user: req.user._id,content}},
            },
        {new: true}
    ).populate("author", "name email username profilePicture headline");

// create a anotification if the comment owner is not the post owner.

    if(post.author._id.toString() !== req.user._id.toString()){
        const newNotification = new Notification({
            recipient: post.author,
            type: "comment",
            relatedUser:req.user._id,
            relatedPost: post._id,
        });
        await newNotification.save();

        // todo 04: send notification>>

        try {
            const postUrl = process.env.CLIENT_URL + "/post/" + postId;
            await sendCommentNotificationEmail(
                post.author.email, 
                post.author.name, 
                req.user.name,
                postUrl,
                content
            );

        } catch (error) {
            console.log("Error in sending comment Email Notification:", error)
            res.status(500).json({message: "Server error"})
            
        }
    }
    res.status(200).json(post);

    } catch (error) {
        console.log("Error in createComment controller:", error);
        res.status(500).json({message: "Server error"})
    }
}

export const likePost = async (req, res)=>{
    try {
        const postId = req.params.id;
        const post = await Post.findById(postId);
        const userId = req.user._id;

        if(post.likes.includes(userId)){
            //unlike the post
            post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
        }else{
            //like the post
            post.likes.push(userId);
            // create a notification if the owner is not the user who liked the post.
            if(post.author.toString() !== userId.toString()){
                const newNotidication = new Notification({
                    recipient: post.author,
                    type: "like",
                    relatedUser:req.user._id,
                    relatedPost: post._id,
                });
                await newNotidication.save();
            }
        }

        await post.save();
        res.status(200).json(post);
        
    } catch (error) {
        console.log("Error in likePost controller:", error);
        res.status(500).json({message: "Server error"})
    }
}