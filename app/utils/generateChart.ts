import { createCanvas, registerFont  } from 'canvas';
import Chart from 'chart.js/auto';
import { fetchUserDataRecentSevenDaysForChart } from '@/app/utils/supabase';

// 커스텀 폰트 등록 (TrueType Font 파일 경로)
registerFont('./public/fonts/Recipekorea.ttf', { family: 'CustomFont' });

// 최근 14일의 날짜 생성 함수
const getLast14DaysLabels = (): string[] => {
    const today = new Date();
    const last14DaysLabels = [];
    for (let i = 0; i < 14; i++) {
        const pastDate = new Date(today);
        pastDate.setDate(today.getDate() - i);
        const year = pastDate.getFullYear();
        const month = String(pastDate.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 +1
        const day = String(pastDate.getDate()).padStart(2, '0');
        last14DaysLabels.unshift(`${year}-${month}-${day}`);
    }
    return last14DaysLabels;
};

const getLast14DaysLabels_MMDD = (): string[] => {
    const today = new Date();
    const last14DaysLabels_MMDD = [];
    for (let i = 0; i < 14; i++) {
        const pastDate = new Date(today);
        pastDate.setDate(today.getDate() - i);
        const year = pastDate.getFullYear();
        const month = String(pastDate.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 +1
        const day = String(pastDate.getDate()).padStart(2, '0');
        last14DaysLabels_MMDD.unshift(`${month}-${day}`);
    }
    return last14DaysLabels_MMDD;
};

// 차트 생성 함수
export const generateChart = async (fid: any) => { // async 추가
    // 데이터 가져오기 (비동기 처리)
    const userChartData = await fetchUserDataRecentSevenDaysForChart(fid);

    // record_date_utc 기준으로 오름차순(과거 → 최신) 정렬
    let sortedUserChartData = [];
    if(userChartData != null){
            sortedUserChartData = userChartData.sort((a, b) => {
            return new Date(a.record_date_utc).getTime() - new Date(b.record_date_utc).getTime();
        });
        console.log("sortedUserChartData=" + JSON.stringify(sortedUserChartData));
    }

    // 최근 7일의 날짜 레이블 생성
    let labels = getLast14DaysLabels();

    //console.log("labels=" + JSON.stringify(labels));
    // sortedUserChartData와 labels를 매칭하여 available_claim_amount 값을 채움
    const availableClaimAmounts = labels.map(label => {
        const entry = sortedUserChartData.find(data => data.record_date_utc.startsWith(label));
        return entry ? entry.available_claim_amount : 0; // 데이터가 없으면 0 반환
    });

    console.log("availableClaimAmounts=" + JSON.stringify(availableClaimAmounts));
    const minClaimAmount = Math.min(...availableClaimAmounts); // 최소값
    const maxClaimAmount = Math.max(...availableClaimAmounts); // 최대값

    let labels14 = getLast14DaysLabels_MMDD(); //실제로 x축은 월일만 보여줌

    console.log("labels14=" + JSON.stringify(labels14));

    const canvas = createCanvas(600, 600); // 크기를 더 크게 설정
    const ctx: any = canvas.getContext('2d');

    const chartConfig: any = {
        type: 'line',
        data: {
            labels: labels14,
            datasets: [
                {
                    //label: 'claim',
                    data: availableClaimAmounts,
                    borderColor: '#006400', // 선 색상
                    backgroundColor: 'rgba(0, 0, 0, 0.1)', // 채워지는 영역 투명도
                    fill: true, // 영역 차트로 만듬
                    pointBackgroundColor: 'red', // 데이터 포인트 색상
                    pointRadius: 2, // 데이터 포인트 크기
                    tension: 0.0, // 선의 부드러움 조정
                }
            ]
        },
        options: {
            responsive: false,
            animation: false,
            layout: {
                padding: {
                    top: 10,
                    bottom: 250, // X축이 잘리지 않도록 아래쪽에 패딩 추가
                }
            },
            plugins: {
                legend: {
                    display: false, // 범례 표시를 비활성화
                    position: 'top',
                    labels: {
                        color: '#006400', // 레전드 텍스트 색상
                        font: {
                            size: 12, // 레전드 텍스트 크기
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'recent 14 days',
                        color: '#006400',
                        font: {
                            size: 14,
                            weight: 'bold',
                            family: 'CustomFont', // Y축에 폰트 적용
                        }
                    },
                    grid: {
                        color: 'rgba(0, 100, 0, 0.3)', // 그리드 선을 흐리게
                        lineWidth: 1, // 그리드 선 두께
                        borderDash: [5, 5], // 점선 스타일
                    },
                    ticks: {
                        color: '#006400',
                        font: {
                            size: 14,
                            weight: 'bold', // Y축 값들을 bold로 설정
                        }
                    },
                    border: {
                        color: '#006400', // X축 검은색 선
                        width: 2, // X축 선 두께
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Available Claim',
                        color: '#006400',
                        font: {
                            size: 14,
                            weight: 'bold',
                            family: 'CustomFont', // Y축에 폰트 적용
                        }
                    },
                    grid: {
                        color: 'rgba(0, 100, 0, 0.3)', // Y축 그리드 선 색상 조정
                        lineWidth: 1, // Y축 그리드 선 두께
                        borderDash: [5, 5], // 점선 스타일
                    },
                    ticks: {
                        color: '#006400',
                        font: {
                            size: 14,
                            weight: 'bold', // Y축 값들을 bold로 설정
                        },
                        //stepSize: 7000, // Y축 간격을 100으로 설정
                    },
                    min: minClaimAmount, // Y축 최소값
                    max: maxClaimAmount, // Y축 최대값을 45000으로 설정하여 간격 조정
                    border: {
                        color: '#006400', // Y축 검은색 선
                        width: 2, // Y축 선 두께
                    }
                }
            }
        }
    };

    new Chart(ctx, chartConfig);

    return canvas.toBuffer();  // 이미지를 Buffer로 반환
};





// import { NextResponse } from "next/server";
// import { NextApiHandler } from 'next';
// import { createCanvas } from 'canvas';
// import Chart, { ChartConfiguration } from 'chart.js/auto';


// const handler: NextApiHandler = async (req, res) => {
//     if (req.method === 'GET') {
//         const data = { 
//             pokemon: {
//                 name: '꼬부기'
//             }
//         }
//         res.status(200).json({ data: data })
//     } 

//     if (req.method === 'POST') {
//         const canvas = createCanvas(800, 600);
//         const ctx: any = canvas.getContext('2d');

//         const chartConfig: ChartConfiguration = {
//             type: 'bar',
//             data: {
//             labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
//             datasets: [
//                 {
//                     label: '# of Votes',
//                     data: [12, 19, 3, 5, 2, 3]
//                 }
//             ]
//             },
//             options: {
//             responsive: false,
//             plugins: {
//                 legend: {
//                 position: 'top'
//                 }
//             }
//             }
//         };
//         const chart = new Chart(ctx, chartConfig);
//         const imageData = canvas.toBuffer();
    
//         res.writeHead(200, {
//             'Content-Type': 'image/png',
//           });
//         res.end(imageData);
//     }
// };

// export default handler;



// import { ChartJSNodeCanvas } from "chartjs-node-canvas";

// const width = 800; // 차트 너비
// const height = 600; // 차트 높이

// export async function generateChart() {
//   const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

//   // 차트 구성 설정
//   const chartConfig: any = {  // 타입을 any로 지정해서 타입 충돌 방지
//     type: "bar", // 차트 종류
//     data: {
//       labels: ["Red", "Blue", "Yellow", "Green", "Purple", "Orange"], // x축 레이블
//       datasets: [
//         {
//           label: "# of Votes", // 데이터셋 레이블
//           data: [12, 19, 3, 5, 2, 3], // 데이터 값
//           backgroundColor: ["red", "blue", "yellow", "green", "purple", "orange"], // 배경색
//         },
//       ],
//     },
//     options: {
//       responsive: false, // 서버에서는 반응형 차트를 사용하지 않음
//       animation: false, // 서버에서는 애니메이션 사용하지 않음
//       plugins: {
//         legend: {
//           display: true, // 범례 표시
//           position: "top", // 범례 위치
//         },
//       },
//       scales: {
//         x: {
//           display: true, // x축 표시
//         },
//         y: {
//           display: true, // y축 표시
//         },
//       },
//     },
//   };

//   // 차트를 이미지 버퍼로 렌더링
//   return await chartJSNodeCanvas.renderToBuffer(chartConfig);
// }


