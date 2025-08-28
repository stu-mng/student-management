import type { SupabaseClient } from '@supabase/supabase-js';
import { googleDriveService } from './service';

export interface TaskFolderInfo {
  helpImageFolderId: string | null;
  uploadFoldersFolderId: string | null;
}

export interface RequirementFolderInfo {
  uploadFolderId: string | null;
}

/**
 * 为任务创建Google Drive文件夹结构
 * @param supabase Supabase客户端
 * @param taskId 任务ID
 * @param taskTitle 任务标题
 * @returns 文件夹信息
 */
export async function createTaskFolders(
  supabase: SupabaseClient,
  taskId: string,
  taskTitle: string
): Promise<TaskFolderInfo> {
  const ROOT_PARENT_FOLDER_ID = '1krx85XuWUk50LPQA3dsVrS0fBWoJh7Sr';
  let helpImageFolderId: string | null = null;
  let uploadFoldersFolderId: string | null = null;

  try {
    // 创建任务根文件夹
    const taskRoot = await googleDriveService.createFolder(
      `任務_${taskTitle}_${taskId}`,
      ROOT_PARENT_FOLDER_ID
    );

    if (taskRoot?.id) {
      // 创建提示图片文件夹
      const helpFolder = await googleDriveService.createFolder('提示圖片', taskRoot.id);
      // 创建档案上传文件夹
      const uploadFolder = await googleDriveService.createFolder('檔案上傳', taskRoot.id);
      
      helpImageFolderId = helpFolder?.id || null;
      uploadFoldersFolderId = uploadFolder?.id || null;
      
      // 更新任务记录中的文件夹ID
      await supabase
        .from('forms')
        .update({
          help_image_folder_id: helpImageFolderId,
          upload_folders_folder_id: uploadFoldersFolderId,
        })
        .eq('id', taskId);
    }
  } catch (error) {
    console.error('創建任務 Google Drive 資料夾失敗:', taskId, error);
  }

  return { helpImageFolderId, uploadFoldersFolderId };
}

/**
 * 为任务要求创建Google Drive文件夹
 * @param supabase Supabase客户端
 * @param taskId 任务ID
 * @param requirementName 要求名称
 * @param existingFolders 现有的文件夹信息
 * @returns 要求文件夹信息
 */
export async function createRequirementFolder(
  supabase: SupabaseClient,
  taskId: string,
  requirementName: string,
  existingFolders: TaskFolderInfo
): Promise<RequirementFolderInfo> {
  let uploadFolderId: string | null = null;

  try {
    // 如果没有现有文件夹，先创建任务文件夹结构
    if (!existingFolders.uploadFoldersFolderId) {
      const { data: taskInfo } = await supabase
        .from('forms')
        .select('title')
        .eq('id', taskId)
        .single();

      if (taskInfo) {
        const newFolders = await createTaskFolders(supabase, taskId, taskInfo.title);
        existingFolders.uploadFoldersFolderId = newFolders.uploadFoldersFolderId;
      }
    }

    // 在档案上传文件夹中创建具体要求文件夹
    if (existingFolders.uploadFoldersFolderId) {
      const requirementFolder = await googleDriveService.createFolder(
        `要求_${requirementName}_${Date.now()}`,
        existingFolders.uploadFoldersFolderId
      );
      uploadFolderId = requirementFolder?.id || null;
    }
  } catch (error) {
    console.error('創建要求 Google Drive 資料夾失敗:', error);
  }

  return { uploadFolderId };
}

/**
 * 获取任务的现有文件夹信息
 * @param supabase Supabase客户端
 * @param taskId 任务ID
 * @returns 文件夹信息
 */
export async function getTaskFolders(
  supabase: SupabaseClient,
  taskId: string
): Promise<TaskFolderInfo> {
  const { data: taskInfo } = await supabase
    .from('forms')
    .select('help_image_folder_id, upload_folders_folder_id')
    .eq('id', taskId)
    .single();

  return {
    helpImageFolderId: taskInfo?.help_image_folder_id || null,
    uploadFoldersFolderId: taskInfo?.upload_folders_folder_id || null,
  };
}
