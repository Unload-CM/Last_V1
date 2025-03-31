import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// 엔티티 레이블 조회 함수
async function getEntityLabel(type: string, id: number | null, language: string = 'ko'): Promise<string> {
  if (!id) return language === 'ko' ? '없음' : language === 'th' ? 'ไม่มี' : 'None';
  
  try {
    switch (type) {
      case 'status':
        const status = await prisma.status.findUnique({ 
          where: { id },
          select: {
            id: true,
            name: true,
            label: true,
            thaiLabel: true,
            description: true,
            thaiDescription: true
          }
        });
        if (!status) return language === 'ko' ? '없음' : language === 'th' ? 'ไม่มี' : 'None';
        return language === 'th' ? status.thaiLabel : 
               language === 'en' ? status.name : 
               status.label;
      
      case 'priority':
        const priority = await prisma.priority.findUnique({ 
          where: { id },
          select: {
            id: true,
            name: true,
            label: true,
            thaiLabel: true,
            description: true,
            thaiDescription: true
          }
        });
        if (!priority) return language === 'ko' ? '없음' : language === 'th' ? 'ไม่มี' : 'None';
        return language === 'th' ? priority.thaiLabel : 
               language === 'en' ? priority.name : 
               priority.label;
      
      case 'category':
        const category = await prisma.category.findUnique({ 
          where: { id },
          select: {
            id: true,
            name: true,
            label: true,
            thaiLabel: true,
            description: true,
            thaiDescription: true
          }
        });
        if (!category) return language === 'ko' ? '없음' : language === 'th' ? 'ไม่มี' : 'None';
        return language === 'th' ? category.thaiLabel : 
               language === 'en' ? category.name : 
               category.label;
      
      case 'department':
        const department = await prisma.department.findUnique({ 
          where: { id },
          select: {
            id: true,
            name: true,
            label: true,
            thaiLabel: true,
            description: true,
            thaiDescription: true
          }
        });
        if (!department) return language === 'ko' ? '없음' : language === 'th' ? 'ไม่มี' : 'None';
        return language === 'th' ? department.thaiLabel : 
               language === 'en' ? department.name : 
               department.label;
      
      case 'employee':
        const employee = await prisma.employee.findUnique({ 
          where: { id },
          select: {
            id: true,
            koreanName: true,
            thaiName: true,
            nickname: true,
            employeeId: true,
            department: {
              select: {
                id: true,
                name: true,
                label: true,
                thaiLabel: true
              }
            }
          }
        });
        if (!employee) return language === 'ko' ? '없음' : language === 'th' ? 'ไม่มี' : 'None';
        
        // 직원 이름 형식: 이름 (사번)
        const employeeName = language === 'th' ? 
                           employee.thaiName || employee.koreanName :
                           language === 'en' ? 
                           employee.nickname || employee.koreanName :
                           employee.koreanName;
        return `${employeeName} (${employee.employeeId})`;
      
      default:
        return language === 'ko' ? '없음' : language === 'th' ? 'ไม่มี' : 'None';
    }
  } catch (error) {
    console.error(`[getEntityLabel] ${type} 레이블 조회 실패:`, error);
    return language === 'ko' ? '없음' : language === 'th' ? 'ไม่มี' : 'None';
  }
}

// 파일 크기 포맷팅 함수
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 이슈 히스토리 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 언어 설정 가져오기
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language') || 'ko';
    
    const issueId = params.id ? parseInt(params.id) : NaN;
    console.log('[히스토리 조회] 요청된 이슈 ID:', issueId, '언어:', language);
    
    if (isNaN(issueId)) {
      console.error('[히스토리 조회] 유효하지 않은 이슈 ID:', params.id);
      return NextResponse.json(
        { error: "유효하지 않은 이슈 ID입니다." },
        { status: 400 }
      );
    }

    // 이슈 존재 여부 확인
    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
    });
    
    console.log('[히스토리 조회] 이슈 조회 결과:', issue ? '이슈 찾음' : '이슈 없음');

    if (!issue) {
      return NextResponse.json(
        { error: "이슈를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 히스토리 조회
    const history = await prisma.issueHistory.findMany({
      where: { issueId },
      include: {
        changedBy: {
          select: {
            id: true,
            koreanName: true,
            thaiName: true,
            nickname: true,
            department: {
              select: {
                id: true,
                name: true,
                label: true,
                thaiLabel: true,
              },
            },
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                koreanName: true
              }
            },
            attachments: true
          }
        },
        attachments: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('[히스토리 조회] 원본 히스토리 데이터:', JSON.stringify(history, null, 2));

    // 타임라인 형식으로 가공
    const timeline = await Promise.all(history.map(async (item) => {
      console.log('[히스토리 항목 처리 시작]', {
        id: item.id,
        changeType: item.changeType,
        hasNewData: !!item.newData,
        hasPreData: !!item.previousData,
        rawNewData: item.newData,
        rawPrevData: item.previousData
      });

      let content = "";
      let title = "";
      
      // 필드 이름을 매핑하는 객체 - 다국어 키로 변경
      const fieldNameMap: { [key: string]: string } = {
        title: "fields.title",
        description: "fields.description",
        statusId: "fields.status",
        priorityId: "fields.priority",
        categoryId: "fields.category",
        departmentId: "fields.department",
        assigneeId: "fields.assignee",
        solverId: "fields.solver",
        dueDate: "fields.dueDate"
      };

      // 히스토리 타이틀 다국어 매핑 추가
      const historyTitles: { [key: string]: { [lang: string]: string } } = {
        fileAdded: {
          ko: '파일 추가됨',
          en: 'File Added',
          th: 'เพิ่มไฟล์แล้ว'
        },
        statusChange: {
          ko: '상태 변경',
          en: 'Status Changed',
          th: 'เปลี่ยนสถานะ'
        },
        priorityChange: {
          ko: '우선순위 변경',
          en: 'Priority Changed',
          th: 'เปลี่ยนความสำคัญ'
        },
        categoryChange: {
          ko: '카테고리 변경',
          en: 'Category Changed',
          th: 'เปลี่ยนหมวดหมู่'
        },
        departmentChange: {
          ko: '부서 변경',
          en: 'Department Changed',
          th: 'เปลี่ยนแผนก'
        },
        assigneeChange: {
          ko: '이슈 발견자 변경',
          en: 'Issue Finder Changed',
          th: 'เปลี่ยนผู้พบปัญหา'
        },
        solverChange: {
          ko: '이슈 해결자 변경',
          en: 'Issue Resolver Changed',
          th: 'เปลี่ยนผู้แก้ไขปัญหา'
        },
        dueDateChange: {
          ko: '예상 마감일 변경',
          en: 'Due Date Changed',
          th: 'เปลี่ยนกำหนดส่ง'
        },
        titleChange: {
          ko: '제목 변경',
          en: 'Title Changed',
          th: 'เปลี่ยนหัวข้อ'
        },
        descriptionChange: {
          ko: '설명 변경',
          en: 'Description Changed',
          th: 'เปลี่ยนรายละเอียด'
        },
        multipleChanges: {
          ko: '여러 항목 변경',
          en: 'Multiple Changes',
          th: 'เปลี่ยนแปลงหลายรายการ'
        }
      };

      // 히스토리 타이틀 가져오기 함수
      const getHistoryTitle = (key: string) => {
        const titleKey = key.replace('issues.history.', '');
        return historyTitles[titleKey]?.[language] || titleKey;
      };

      // 변경된 필드만 추출하여 표시
      if (item.previousData && item.newData) {
        try {
          // JSON 파싱 개선
          const parsePrevData = (data: any) => {
            try {
              if (typeof data === 'string') {
                try {
                  // 이중 JSON 문자열 처리
                  let parsed = JSON.parse(data);
                  // 여전히 문자열이면 한 번 더 파싱
                  if (typeof parsed === 'string') {
                    parsed = JSON.parse(parsed);
                  }
                  return parsed;
                } catch {
                  // JSON 파싱 실패 시 원본 반환
                  return data;
                }
              }
              // 이미 객체인 경우 그대로 반환
              return data;
            } catch (error) {
              console.error('이전 데이터 파싱 오류:', error);
              return {};
            }
          };

          const parseNewData = (data: any) => {
            try {
              if (typeof data === 'string') {
                try {
                  // 이중 JSON 문자열 처리
                  let parsed = JSON.parse(data);
                  // 여전히 문자열이면 한 번 더 파싱
                  if (typeof parsed === 'string') {
                    parsed = JSON.parse(parsed);
                  }
                  return parsed;
                } catch {
                  // JSON 파싱 실패 시 원본 반환
                  return data;
                }
              }
              // 이미 객체인 경우 그대로 반환
              return data;
            } catch (error) {
              console.error('새 데이터 파싱 오류:', error);
              return {};
            }
          };

          const prev = parsePrevData(item.previousData);
          const next = parseNewData(item.newData);
          
          console.log('[데이터 파싱 결과]', {
            id: item.id,
            parsedPrev: JSON.stringify(prev),
            parsedNext: JSON.stringify(next),
            prevDueDate: prev.dueDate,
            nextDueDate: next.dueDate
          });

          const changes: string[] = [];
          
          // 파일 업로드인 경우
          if (item.changeType === 'FILE_UPLOAD') {
            if (next.fileName && next.fileSize) {
              const fileSizeFormatted = formatFileSize(next.fileSize);
              changes.push(`${language === 'ko' ? '파일명' : language === 'th' ? 'ชื่อไฟล์' : 'File Name'}: ${next.fileName}`);
              changes.push(`${language === 'ko' ? '파일크기' : language === 'th' ? 'ขนาดไฟล์' : 'File Size'}: ${fileSizeFormatted}`);
              title = getHistoryTitle('issues.history.fileAdded');
            }
          } else {
            // 일반 필드 변경의 경우
            const fields = ['statusId', 'priorityId', 'categoryId', 'departmentId', 'assigneeId', 'solverId', 'title', 'description', 'dueDate'];
            let changedFieldCount = 0;
            
            // 필드 레이블 다국어 매핑
            const fieldLabels: { [key: string]: { [lang: string]: string } } = {
              status: {
                ko: '상태',
                en: 'Status',
                th: 'สถานะ'
              },
              priority: {
                ko: '우선순위',
                en: 'Priority',
                th: 'ความสำคัญ'
              },
              category: {
                ko: '카테고리',
                en: 'Category',
                th: 'หมวดหมู่'
              },
              department: {
                ko: '부서',
                en: 'Department',
                th: 'แผนก'
              },
              assignee: {
                ko: '이슈 발견자',
                en: 'Issue Finder',
                th: 'ผู้พบปัญหา'
              },
              solver: {
                ko: '이슈 해결자',
                en: 'Issue Resolver',
                th: 'ผู้แก้ไขปัญหา'
              },
              dueDate: {
                ko: '예상 마감일',
                en: 'Due Date',
                th: 'กำหนดส่ง'
              },
              title: {
                ko: '제목',
                en: 'Title',
                th: 'หัวข้อ'
              },
              description: {
                ko: '설명',
                en: 'Description',
                th: 'รายละเอียด'
              }
            };

            const getFieldLabel = (field: string) => {
              const key = field.replace('Id', '').toLowerCase();
              return fieldLabels[key]?.[language] || key;
            };

            const getArrowSymbol = () => ' → ';  // 모든 언어에서 동일한 화살표 사용
            const getNoneText = () => language === 'ko' ? '없음' : language === 'th' ? 'ไม่มี' : 'None';
            
            for (const field of fields) {
              const prevValue = prev[field];
              const nextValue = next[field];
              
              if (JSON.stringify(prevValue) !== JSON.stringify(nextValue)) {
                changedFieldCount++;
                console.log(`[필드 변경 감지] ${field}:`, {
                  prevValue,
                  nextValue,
                  fieldType: typeof prevValue
                });
                
                let displayText = '';
                const arrow = getArrowSymbol();
                
                switch (field) {
                  case 'statusId':
                    const [statusPrev, statusNext] = await Promise.all([
                      getEntityLabel('status', prevValue, language),
                      getEntityLabel('status', nextValue, language)
                    ]);
                    if (changedFieldCount === 1) title = getHistoryTitle('issues.history.statusChange');
                    displayText = `${getFieldLabel('status')}: ${statusPrev}${arrow}${statusNext}`;
                    changes.push(displayText);
                    break;
                    
                  case 'priorityId':
                    const [priorityPrev, priorityNext] = await Promise.all([
                      getEntityLabel('priority', prevValue, language),
                      getEntityLabel('priority', nextValue, language)
                    ]);
                    if (changedFieldCount === 1) title = getHistoryTitle('issues.history.priorityChange');
                    displayText = `${getFieldLabel('priority')}: ${priorityPrev}${arrow}${priorityNext}`;
                    changes.push(displayText);
                    break;
                    
                  case 'categoryId':
                    const [categoryPrev, categoryNext] = await Promise.all([
                      getEntityLabel('category', prevValue, language),
                      getEntityLabel('category', nextValue, language)
                    ]);
                    if (changedFieldCount === 1) title = getHistoryTitle('issues.history.categoryChange');
                    displayText = `${getFieldLabel('category')}: ${categoryPrev}${arrow}${categoryNext}`;
                    changes.push(displayText);
                    break;
                    
                  case 'departmentId':
                    const [deptPrev, deptNext] = await Promise.all([
                      getEntityLabel('department', prevValue, language),
                      getEntityLabel('department', nextValue, language)
                    ]);
                    if (changedFieldCount === 1) title = getHistoryTitle('issues.history.departmentChange');
                    displayText = `${getFieldLabel('department')}: ${deptPrev}${arrow}${deptNext}`;
                    changes.push(displayText);
                    break;

                  case 'assigneeId':
                    const [assigneePrev, assigneeNext] = await Promise.all([
                      getEntityLabel('employee', prevValue, language),
                      getEntityLabel('employee', nextValue, language)
                    ]);
                    if (changedFieldCount === 1) title = getHistoryTitle('issues.history.assigneeChange');
                    displayText = `${getFieldLabel('assignee')}: ${assigneePrev}${arrow}${assigneeNext}`;
                    changes.push(displayText);
                    break;

                  case 'solverId':
                    const [solverPrev, solverNext] = await Promise.all([
                      getEntityLabel('employee', prevValue, language),
                      getEntityLabel('employee', nextValue, language)
                    ]);
                    if (changedFieldCount === 1) title = getHistoryTitle('issues.history.solverChange');
                    displayText = `${getFieldLabel('solver')}: ${solverPrev}${arrow}${solverNext}`;
                    changes.push(displayText);
                    break;

                  case 'dueDate':
                    if (changedFieldCount === 1) title = getHistoryTitle('issues.history.dueDateChange');
                    const formattedPrevDate = prevValue ? new Date(prevValue).toISOString().split('T')[0] : getNoneText();
                    const formattedNextDate = nextValue ? new Date(nextValue).toISOString().split('T')[0] : getNoneText();
                    displayText = `${getFieldLabel('dueDate')}: ${formattedPrevDate}${arrow}${formattedNextDate}`;
                    changes.push(displayText);
                    break;

                  case 'title':
                    if (changedFieldCount === 1) title = getHistoryTitle('issues.history.titleChange');
                    displayText = `${getFieldLabel('title')}: ${prevValue}${arrow}${nextValue}`;
                    changes.push(displayText);
                    break;

                  case 'description':
                    if (changedFieldCount === 1) title = getHistoryTitle('issues.history.descriptionChange');
                    displayText = language === 'ko' ? '설명 변경됨' : 
                                language === 'th' ? 'การเปลี่ยนแปลงคำอธิบาย' : 
                                'Description Changed';
                    changes.push(displayText);
                    break;
                }
              }
            }

            // 여러 필드가 변경된 경우
            if (changedFieldCount > 1) {
              title = getHistoryTitle('issues.history.multipleChanges');
            }
          }
          
          content = changes.join('\n');
          
          console.log('[변환된 내용]', {
            title,
            content,
            changes
          });
          
        } catch (error) {
          console.error('[히스토리 데이터 처리 오류]:', error);
          content = language === 'ko' ? '데이터 처리 중 오류가 발생했습니다.' :
                   language === 'th' ? 'เกิดข้อผิดพลาดในการประมวลผลข้อมูล' :
                   'An error occurred while processing data.';
          title = '';
        }
      }

      return {
        id: item.id,
        title,
        content,
        comments: item.comments,
        createdAt: item.createdAt,
        changedBy: item.changedBy,
        changeType: item.changeType,
        rootCause: item.rootCause,
        actionTaken: item.actionTaken,
        preventiveMeasure: item.preventiveMeasure,
        resolutionNote: item.resolutionNote
      };
    }));

    return NextResponse.json({ history: timeline });
  } catch (error) {
    console.error("이슈 히스토리 조회 중 오류 발생:", error);
    return NextResponse.json(
      { error: "이슈 히스토리를 조회하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 히스토리 항목 추가 API
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    console.log('[히스토리] 세션 정보:', session?.user?.id);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    let userExists: any = null;
    
    // 1. ID로 직접 조회
    if (session.user.id) {
      const numericId = typeof session.user.id === 'string' ? parseInt(session.user.id) : session.user.id;
      if (!isNaN(numericId)) {
        userExists = await prisma.employee.findUnique({
          where: { id: numericId }
        });
      }
    }
    
    // 2. employeeId로 조회
    if (!userExists && session.user.email) {
      userExists = await prisma.employee.findFirst({
        where: { employeeId: session.user.email }
      });
    }
    
    // 3. 이름으로 조회
    if (!userExists && session.user.name) {
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
      if (session.user.isAdmin) {
        userExists = await prisma.employee.findFirst({
          where: { isAdmin: true }
        });
      }
      
      if (!userExists) {
        userExists = await prisma.employee.findFirst();
      }
    }
    
    if (!userExists) {
      console.error('[히스토리] 로그인한 사용자를 찾을 수 없음:', session.user.id);
      return NextResponse.json(
        { error: "유효한 사용자를 찾을 수 없습니다." },
        { status: 400 }
      );
    }

    console.log('[히스토리] 사용자 확인:', {
      id: userExists.id,
      name: userExists.koreanName
    });

    const issueId = parseInt(params.id);
    
    const {
      changeType,
      previousData,
      newData,
      summary,
      rootCause,
      actionTaken,
      preventiveMeasure,
      resolutionNote
    } = await request.json();
    
    if (!changeType || !summary) {
      return NextResponse.json(
        { error: '변경 유형과 요약 정보는 필수입니다' },
        { status: 400 }
      );
    }
    
    const historyEntry = await prisma.issueHistory.create({
      data: {
        issueId,
        changeType,
        previousData: previousData ? JSON.stringify(previousData) : undefined,
        newData: newData ? JSON.stringify(newData) : undefined,
        summary,
        rootCause: rootCause || undefined,
        actionTaken: actionTaken || undefined,
        preventiveMeasure: preventiveMeasure || undefined,
        resolutionNote: resolutionNote || undefined,
        changedById: userExists.id,
      }
    });
    
    console.log('[히스토리] 생성 완료:', historyEntry.id);
    
    return NextResponse.json(historyEntry);
  } catch (error) {
    console.error('[히스토리] 이슈 히스토리 생성 오류:', error);
    return NextResponse.json(
      { error: '이슈 히스토리 생성 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// 히스토리 항목 삭제 API
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }
    
    const issueId = parseInt(params.id);
    const searchParams = new URL(request.url).searchParams;
    const historyId = searchParams.get('historyId');

    if (!historyId) {
      return NextResponse.json(
        { error: '히스토리 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    console.log('[히스토리:DELETE] 삭제 요청:', { issueId, historyId });

    // 현재 로그인한 사용자 정보 가져오기
    const employee = await prisma.employee.findUnique({
      where: { employeeId: session.user.email },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "직원 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 히스토리 항목 존재 여부와 작성자 확인
    const historyItem = await prisma.issueHistory.findUnique({
      where: { 
        id: parseInt(historyId),
        issueId: issueId
      },
      include: {
        changedBy: true
      }
    });

    if (!historyItem) {
      return NextResponse.json(
        { error: '해당 히스토리 항목을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    // 본인이 작성한 히스토리만 삭제 가능
    if (historyItem.changedById !== employee.id) {
      return NextResponse.json(
        { error: '본인이 작성한 히스토리만 삭제할 수 있습니다.' },
        { status: 403 }
      );
    }

    // 히스토리 항목과 관련된 댓글 삭제
    await prisma.issueComment.deleteMany({
      where: { historyId: parseInt(historyId) }
    });
    
    // 히스토리 항목 삭제
    await prisma.issueHistory.delete({
      where: { id: parseInt(historyId) }
    });

    console.log('[히스토리:DELETE] 삭제 완료:', historyId);
    
    return NextResponse.json({ 
      message: '히스토리 항목이 성공적으로 삭제되었습니다.',
      historyId: parseInt(historyId)
    });
  } catch (error) {
    console.error('[히스토리:DELETE] 삭제 중 오류 발생:', error);
    return NextResponse.json(
      { error: '히스토리 항목을 삭제하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 