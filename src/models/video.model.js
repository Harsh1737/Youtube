import mongoose, { Schema } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';
// this allows us to paginate the results of our queries.
// this allows us to write aggregation queries.

const videoSchema = new Schema(
    {
        videoFile :{
            type : String,
            required : true,
        },
        thumbnail :{
            type : String,
            required : true,
        },
        title :{
            type : String,
            required : true,
        },
        description :{
            type : String,
            required : true,
        },
        duration :{ // from the service provider 
            type : Number,
            required : true,
        },
        views :{
            type : Number,
            default : 0,
        },
        isPublished: {
            type: Boolean,
            default: true,
        },
        owner :{
            type : Schema.Types.ObjectId,
            ref : "User"
        }
    },
    {
        timestamps : true
    }
);

videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model('Video', videoSchema);