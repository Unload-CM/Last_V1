import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { mkdir, writeFile, stat } from "fs/promises";
import path from "path";
import fs from "fs/promises";

// Next.js App Router에서는 이 방식으로 bodyParser 설정
export const dynamic = 'force-dynamic';

// 첨부 파일 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const issueId = parseInt(params.id);
    if (isNaN(issueId)) {
      return NextResponse.json(
        { error: "유효하지 않은 이슈 ID입니다." },
        { status: 400 }
      );
    }

    const attachments = await prisma.issueAttachment.findMany({
      where: { issueId },
      orderBy: { createdAt: "desc" },
      include: {
        uploader: {
          select: {
            id: true,
            koreanName: true,
            thaiName: true,
            nickname: true,
            department: {
              select: {
                id: true,
                name: true,
                label: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json(attachments);
  } catch (error) {
    console.error("첨부 파일 목록 조회 중 오류 발생:", error);
    return NextResponse.json(
      { error: "첨부 파일 목록을 조회하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 첨부 파일 생성
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[API] 파일 업로드 요청 시작 - 이슈 ID:', params.id);
    
    // 인증 검사
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.error('[API] 인증 실패: 세션 없음');
      return NextResponse.json(
        { error: "인증되지 않은 사용자입니다." },
        { status: 401 }
      );
    }

    console.log('[API] 인증 성공, 사용자 ID:', session.user.id);

    const issueId = parseInt(params.id);
    if (isNaN(issueId)) {
      console.error('[API] 유효하지 않은 이슈 ID:', params.id);
      return NextResponse.json(
        { error: "유효하지 않은 이슈 ID입니다." },
        { status: 400 }
      );
    }

    // 이슈 존재 여부 확인
    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
    });

    if (!issue) {
      console.error('[API] 이슈를 찾을 수 없음. ID:', issueId);
      return NextResponse.json(
        { error: "이슈를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 업로드 디렉토리 확인 및 생성
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    
    try {
      // 디렉토리 존재 확인
      await fs.mkdir(uploadsDir, { recursive: true });
      console.log('[API] 업로드 디렉토리 준비 완료:', uploadsDir);
    } catch (err) {
      console.error('[API] 디렉토리 생성 오류:', err);
      // 여기서 오류가 발생해도 계속 진행, 이미 디렉토리가 있을 수 있음
    }

    // FormData 처리
    let formData;
    try {
      formData = await request.formData();
      console.log('[API] FormData 파싱 성공');
    } catch (error) {
      console.error('[API] FormData 파싱 오류:', error);
      return NextResponse.json(
        { error: "폼 데이터를 파싱할 수 없습니다." },
        { status: 400 }
      );
    }
    
    // 파일 추출
    const file = formData.get("file");
    if (!file || !(file instanceof Blob)) {
      console.error('[API] 유효한 파일 없음, formData 내용:', Object.fromEntries(formData.entries()));
      return NextResponse.json(
        { error: "유효한 파일이 제공되지 않았습니다." },
        { status: 400 }
      );
    }

    // 명시적으로 제공된 파일명 사용
    const providedFileName = formData.get("fileName") as string | null;

    console.log('[API] 파일 정보:', {
      타입: file.type,
      크기: file.size,
      제공된파일명: providedFileName
    });

    // 파일명 생성
    const timestamp = new Date().getTime();
    let originalName = 'unknown';
    
    if (providedFileName) {
      originalName = providedFileName;
      console.log('[API] 제공된 파일명 사용:', originalName);
    } else if (file instanceof File) {
      originalName = file.name;
      console.log('[API] File 객체에서 파일명 가져옴:', originalName);
    } else {
      // Blob 객체인 경우 확장자 유추
      const mimeToExt: Record<string, string> = {
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif',
        'image/webp': '.webp',
        'video/mp4': '.mp4',
        'video/webm': '.webm',
        'application/pdf': '.pdf',
        'text/plain': '.txt',
      };
      
      const ext = mimeToExt[file.type] || '.bin';
      originalName = `file${ext}`;
      console.log('[API] Blob 객체, 생성 파일명:', originalName);
    }
    
    const fileExt = path.extname(originalName);
    const fileName = `${path.basename(originalName, fileExt)}_${timestamp}${fileExt}`;
    const filePath = path.join(uploadsDir, fileName);
    
    console.log('[API] 저장할 파일 경로:', filePath);

    try {
      // 파일 데이터를 버퍼로 변환
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      // 버퍼 정보 로그
      console.log('[API] 파일 버퍼 크기:', buffer.length);
      
      // 파일 저장
      await fs.writeFile(filePath, buffer);
      console.log('[API] 파일 저장 완료. 경로:', filePath);
      
      // 저장된 파일 정보 확인
      try {
        const fileStats = await fs.stat(filePath);
        console.log('[API] 저장된 파일 크기:', fileStats.size);
        
        if (fileStats.size === 0) {
          console.error('[API] 파일이 비어 있습니다');
          return NextResponse.json(
            { error: "저장된 파일이 비어 있습니다." },
            { status: 500 }
          );
        }
      } catch (statError) {
        console.error('[API] 파일 상태 확인 오류:', statError);
      }
      
      // 사용자 ID 가져오기
      if (!session?.user?.id) {
        console.error('[API] 세션에 유저 ID가 없음');
        return NextResponse.json(
          { error: "인증된 사용자 정보가 없습니다. 로그인 후 다시 시도해주세요." },
          { status: 401 }
        );
      }
      
      console.log('[API] 세션 정보:', {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        isAdmin: session.user.isAdmin
      });
      
      // 사용자 조회를 위한 조건 설정
      let userExists: any = null;
      
      // 1. 세션 ID가 숫자인 경우 ID로 직접 조회
      if (session.user.id) {
        const numericId = typeof session.user.id === 'string' ? parseInt(session.user.id) : session.user.id;
        if (!isNaN(numericId)) {
          console.log('[API] 사용자 ID(숫자)로 조회:', numericId);
          
          userExists = await prisma.employee.findUnique({
            where: { id: numericId }
          });
        }
      }
      
      // 2. ID로 찾지 못했고 이메일(employeeId)이 있는 경우
      if (!userExists && session.user.email) {
        console.log('[API] 사용자 이메일(employeeId)로 조회:', session.user.email);
        
        userExists = await prisma.employee.findFirst({
          where: { employeeId: session.user.email }
        });
      }
      
      // 3. 여전히 찾지 못했고 이름으로 조회
      if (!userExists && session.user.name) {
        console.log('[API] 사용자 이름으로 조회:', session.user.name);
        
        userExists = await prisma.employee.findFirst({
          where: {
            OR: [
              { koreanName: session.user.name },
              { thaiName: session.user.name },
              { nickname: session.user.name }
            ]
          }
        });
      }
      
      // 4. 대체 사용자 찾기
      if (!userExists) {
        console.warn('[API] 세션 정보로 사용자를 찾을 수 없음. 대체 업로더를 찾는 중...');
        
        // 관리자인 경우 다른 관리자 찾기
        if (session.user.isAdmin) {
          userExists = await prisma.employee.findFirst({
            where: { isAdmin: true }
          });
        }
        
        // 관리자도 없으면 아무 사용자나 찾기
        if (!userExists) {
          userExists = await prisma.employee.findFirst();
        }
        
        // 그래도 없으면 기본 사용자 ID 1 사용
        if (!userExists) {
          console.warn('[API] 대체 사용자를 찾을 수 없습니다. 기본 ID 1을 사용합니다.');
          const userId = 1;
          console.log('[API] 파일 업로드, 기본 사용자 ID:', userId);
          
          // 파일을 저장하고 계속 진행
          const fileUrl = `/uploads/${fileName}`;
          console.log('[API] 파일 URL:', fileUrl);
          
          try {
            const attachment = await prisma.issueAttachment.create({
              data: {
                fileName: originalName,
                fileUrl,
                fileType: file.type,
                fileSize: file.size,
                issueId,
                uploaderId: userId  // 기본 ID 사용
              }
            });
            
            console.log('[API] DB 저장 완료, 첨부파일 ID:', attachment.id);
            console.log('[API] 업로드 완료, 응답 반환');
            return NextResponse.json(attachment, { status: 201 });
          } catch (dbError) {
            console.error('[API] DB 저장 오류:', dbError);
            return NextResponse.json(
              { error: `데이터베이스 저장 중 오류가 발생했습니다: ${dbError.message}` },
              { status: 500 }
            );
          }
        }
      }
      
      const userId = userExists.id;
      console.log('[API] 파일 업로드, 사용자:', {
        id: userId,
        name: userExists.koreanName || userExists.thaiName || userExists.nickname || userExists.employeeId,
        employeeId: userExists.employeeId
      });
      
      // 데이터베이스에 파일 정보 저장
      const fileUrl = `/uploads/${fileName}`;
      console.log('[API] 파일 URL:', fileUrl);
      
      try {
        const attachment = await prisma.issueAttachment.create({
          data: {
            fileName: originalName,
            fileUrl,
            fileType: file.type,
            fileSize: file.size,
            issueId,
            uploaderId: userId,
          },
          include: {
            uploader: {
              select: {
                id: true,
                koreanName: true,
                thaiName: true,
                nickname: true,
                department: {
                  select: {
                    id: true,
                    name: true,
                    label: true
                  }
                }
              }
            }
          }
        });
        
        console.log('[API] DB 저장 완료, 첨부파일 ID:', attachment.id);
  
        // 히스토리 생성을 시도하지만 실패해도 업로드는 성공으로 처리
        try {
          console.log('[API] 히스토리 생성 시도, 사용자 ID:', userId);
          
          await prisma.issueHistory.create({
            data: {
              issueId,
              changedById: userId,
              changeType: 'FILE_UPLOAD',
              summary: JSON.stringify([{
                field: "첨부파일",
                oldValue: "없음",
                newValue: originalName
              }]),
              previousData: "{}",
              newData: JSON.stringify({
                fileName: originalName,
                fileType: file.type,
                fileSize: file.size,
                fileUrl,
                uploaderId: userId
              })
            }
          });
          
          console.log('[API] 히스토리 생성 성공');
        } catch (historyError) {
          console.error('[API] 히스토리 생성 실패 (파일 업로드는 성공):', historyError);
          // 히스토리 생성 실패해도 업로드는 성공으로 처리
        }
  
        console.log('[API] 업로드 완료, 응답 반환');
        return NextResponse.json(attachment, { status: 201 });
      } catch (dbError) {
        console.error('[API] DB 저장 오류:', dbError);
        return NextResponse.json(
          { error: `데이터베이스 저장 중 오류가 발생했습니다: ${dbError.message}` },
          { status: 500 }
        );
      }
    } catch (saveError) {
      console.error('[API] 파일 저장 오류:', saveError);
      return NextResponse.json(
        { error: `파일 저장 중 오류가 발생했습니다: ${saveError.message}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("[API] 전체 업로드 과정 오류:", error);
    return NextResponse.json(
      { error: `첨부 파일 업로드 중 오류가 발생했습니다: ${error.message}` },
      { status: 500 }
    );
  }
}

// 첨부 파일 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 임시로 세션 검사 비활성화 (삭제 테스트를 위해)
    // const session = await getServerSession(authOptions);
    // if (!session?.user) {
    //   return NextResponse.json(
    //     { error: "인증되지 않은 사용자입니다." },
    //     { status: 401 }
    //   );
    // }

    const searchParams = new URL(request.url).searchParams;
    const attachmentId = parseInt(searchParams.get("attachmentId") || "");

    if (isNaN(attachmentId)) {
      return NextResponse.json(
        { error: "유효하지 않은 첨부 파일 ID입니다." },
        { status: 400 }
      );
    }

    const attachment = await prisma.issueAttachment.findUnique({
      where: { id: attachmentId },
      include: { issue: true },
    });

    if (!attachment) {
      return NextResponse.json(
        { error: "첨부 파일을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 파일 시스템에서 파일 삭제 시도
    try {
      const publicDir = path.join(process.cwd(), 'public');
      const filePath = path.join(publicDir, attachment.fileUrl.replace(/^\//, ''));
      await fs.unlink(filePath);
      console.log('파일 삭제 완료:', filePath);
    } catch (error) {
      console.error("파일 삭제 중 오류 발생:", error);
      // 파일 삭제 실패해도 DB에서는 삭제 진행
    }

    await prisma.issueAttachment.delete({
      where: { id: attachmentId },
    });

    return NextResponse.json({ message: "첨부 파일이 삭제되었습니다." });
  } catch (error) {
    console.error("첨부 파일 삭제 중 오류 발생:", error);
    return NextResponse.json(
      { error: "첨부 파일을 삭제하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}