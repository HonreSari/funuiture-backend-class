import express from 'express'
import { getAllUsers } from '../../../controllers/admin/userController';
import { setMaintenance } from '../../../controllers/admin/systemController';
import upload from '../../../middlewares/uploadFiles';
import { createPost, deletePost, updatePost } from '../../../controllers/admin/postController';

const router = express.Router();

router.get('/users', getAllUsers)
router.post('/maintenance', setMaintenance)

//CRUD for posts
router.post('/posts', upload.single('image'), createPost);
router.patch('/posts', upload.single('image'), updatePost);
router.delete('/posts', deletePost);

//CRUD for products
router.post('/products', upload.array('images'), createPost);
router.patch('/products', upload.array('images'), updatePost);
router.delete('/products', deletePost);
export default router