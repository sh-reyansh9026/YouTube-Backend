import mongoose,{Schema} from "mongoose"

const subscriptionSchema = new Schema({
    subscriber: {
        type: Schema.types > ObjectId, // one who is subscribing
        ref: "User"
    },
    channel: {
        type: Schema.Types.ObjectId, // one to whom subscriber is subscribing
        ref: "User"
    }
}, {
    timestamps:true
})

export const Subscription = mongoose.model("Subscription", subscriptionSchema)

// in mongo db in this model whcih contains subscriber and channel both are user
// so here a document is made everytime a subscriber subscribes a chnannel which contains the channel name and subscriber
// so suppose there are 3 users a,b,c
// and 3 channels CAC,HCC,FCC
// so suppose user 'a' subscribes channel CAC, so a document is made which contains channel-CAC , subscriber-a
// suppose user 'b' subscribes channel CAC, so another document is made which contains channel-CAC , subscriber-b
// so if we want to find how many subscribers a particular channel is having,so for this we have to check how many documents are having that particular channel name
// and if we want to find how many channels a particular user has subscribed , we have to count the no. of documents having subscriber as that particular user name
// to find subscriber --> check documents for channel name
// to find channel --> check documents for subscriber name
// this is how we count no of subscribers and channels any user subscribed
