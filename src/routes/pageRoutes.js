const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadMiddleware');

const {
    createPage,
    joinPage,
    approveRequest,
    leavePage,
    getAllPages,
    getPagesByUser,
    getPageById,
    uploadOrUpdateCoverPhoto,
    updatePage,

    deletedata
} = require('../controllers/pagesController');

router.post('/create', upload.fields([
    { name: 'groupProfilePic', maxCount: 1 },
  ]), createPage);
router.get('/', getAllPages);
router.get('/:pageId', getPageById);
router.post('/join/:pageId', joinPage);
router.post('/approve/:pageId/:requestId', approveRequest);
router.post('/leave/:pageId', leavePage);
router.get('/user/:userId', getPagesByUser);
router.delete('/delete', deletedata);
router.put('/:pageId/cover-photo', upload.fields([{ name: 'groupCoverImage', maxCount: 1 }]), uploadOrUpdateCoverPhoto);
router.put(
  '/:pageId/update',
  upload.fields([{ name: 'groupProfilePic', maxCount: 1 }]),
  updatePage
);




module.exports = router;
