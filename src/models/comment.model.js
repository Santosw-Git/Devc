import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new mongoose.Schema({


})

commentSchema.plugin(mongooseAggregatePaginate);


export const Comment = mongoose.model("Comment" , commentSchema)