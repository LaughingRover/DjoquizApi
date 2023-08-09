|
|----logs/
|----docs/
|----node_modules/
|----static/
|       |--images/
|
|----src/
|       |----constants/
|       |       |----excludedPaths.js
|       |
|       |----db/
|       |       |----models/
|       |       |       |----userModel.js
|       |       |       |----categoryModel.js
|       |       |       |----subCategoryModel.js
|       |       |       |----questionnaireModel.js
|       |       |       |----questionModel.js
|       |       |             
|       |       |----actions/
|       |       |       |----getAction.js
|       |       |       |----updateAction.js
|       |       |       |----createAction.js
|       |       |       |----deleteAction.js
|       |       |
|       |       |----index.js
|       |
|       |----controllers/
|       |       |----userController.js
|       |       |----questionController.js
|       |       |----questionnaireController.js
|       |       |----categoryController.js
|       |       |----subCategoryController.js
|       |
|       |----routers/
|       |       |----middlewares/
|       |       |       |----auth.js
|       |       |       |----index.js
|       |       |
|       |       |----userRouter.js
|       |       |----questionRouter.js
|       |       |----questionnaireRouter.js
|       |       |----categoryRouter.js
|       |       |----subCategoryRouter.js
|       |       |----index.js
|       |
|       |----utils/
|       |       |----logger.js
|       |       |----tokenManager.js
|       |
|       |----index.js
|
|----.gitignore
|----package.json
|----package-lock.json
|----README.md
|----Procfile
|----bitbucket-pipelines.yml