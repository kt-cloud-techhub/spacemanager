import pandas as pd

# Creating a flat hierarchy sample for SpaceManager
# Columns: [본부, 담당, 팀, 사번, 이름, 역할]
data = [
    ["Cloud사업본부", "Cloud인프라담당", "OS관리팀", "EMP001", "홍길동", "팀장"],
    ["Cloud사업본부", "Cloud인프라담당", "OS관리팀", "EMP002", "김철수", "팀원"],
    ["Cloud사업본부", "Cloud인프라담당", "네트워크팀", "EMP003", "이영희", "팀원"],
    ["Cloud사업본부", "Cloud개발담당", "플랫폼개발팀", "EMP101", "박보검", "팀원"],
    ["전략기획본부", "기획실", "", "EMP999", "최강자", "상무 (임원)"],
]

df = pd.DataFrame(data, columns=["본부", "담당", "팀", "사번", "이름", "역할"])
df.to_excel("sample_org.xlsx", index=False)
print("sample_org.xlsx generated successfully.")
