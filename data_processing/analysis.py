import matplotlib.pyplot as plt
import seaborn as sns
import csv
import pandas as pd
import os
import pingouin as pg
import numpy as np

import statsmodels.api as sm
from statsmodels.formula.api import ols
from statsmodels.stats.multicomp import pairwise_tukeyhsd

POSITIVESOUND = "M3.mp3"
NEGATIVESOUND = "m2.mp3"
POSITIVEWORDS = ["Sweet","Lively","Gentle","Cuddle","Excite","Kiss","Comfy","Relax",]
NEGATIVEWORDS = ["Rabid","Hijack","Death","Vomit","Arrest","Fatal","Dismal","Morgue"]


# ======================== data gathering


def participant(partipantNum):
    # f-positive
    TESTTRIAL = "data-task-o85l"
    PRETRIAL = "data-task-imiz"
    POSTTRIAL = "data-task-cp4v"
    
    folder = str(partipantNum)+"/data/"

    # checks for partipant used other side
    if not os.path.exists(folder+TESTTRIAL+".csv"):
        # f-negative
        TESTTRIAL = "data-task-1v1u"
        PRETRIAL = "data-task-aeyv"
        POSTTRIAL = "data-task-iq5a"

    # get files
    testdataset = pd.read_csv(folder + "/" + TESTTRIAL + ".csv")
    predataset = pd.read_csv(folder + "/" + PRETRIAL + ".csv")
    postdataset = pd.read_csv(folder + "/" + POSTTRIAL + ".csv")

    # remove rows that dont have useful information
    testdataset = getRows(testdataset)
    predataset = getRows(predataset)
    postdataset = getRows(postdataset)
    
    testpercent, testdataset = getCorrect(testdataset)
    prepercent, predataset = getCorrect(predataset)
    postpercent, postdataset = getCorrect(postdataset)   

    # reject participant if dont get 75% correct in all 3
    if min(testpercent, prepercent, postpercent) < 75:
        return "FAIL"
    # END IF

    # get only relevant columns
    testdataset = testdataset[["stimuliWord", "primechord", "Response", "Reaction Time", "Correct", "Incorrect"]]
    predataset = predataset[["stimuliWord", "primechord", "Response", "Reaction Time", "Correct", "Incorrect"]]
    postdataset = postdataset[["stimuliWord", "primechord", "Response", "Reaction Time", "Correct", "Incorrect"]]

    preTimes = getTimes(predataset)
    postTimes = getTimes(postdataset)
    # testTimes = getTestTimes(testdataset)

    return preTimes, postTimes
# END DEF


def testMultiple(numList):
    timesList = []

    for num in numList:
        times = participant(num)
        if times != "FAIL":
            timesList.append(times)
        # END IF
    # END FOR

    return timesList
# END DEF


# ============================ data manipulation


def getRows(dataset):
    dataset = dataset[dataset.display == "mainTrial"]
    dataset = dataset[dataset.Correct == 1]
    dataset = dataset[dataset["Reaction Time"] > 250]
    dataset = dataset[dataset["Reaction Time"] < 2000]
    dataset = dataset[(dataset.Response == "Neg-Pressed") | (dataset.Response == "Pos-Pressed")]

    return dataset
# END DEF


def getCorrect(dataset):
    # get number of correct responses in each trial
    mainTrial = dataset[dataset.display == "mainTrial"]
    responses = mainTrial[(mainTrial.Response == "Neg-Pressed") | (mainTrial.Response == "Pos-Pressed")]

    numCorrect = responses[responses.Correct == 1].shape[0]
    numIncorrect = responses[responses.Correct == 0].shape[0]
    percent = (numCorrect/(numCorrect+numIncorrect))*100

    correctResponses = responses[responses.Correct == 1]
    
    return percent, correctResponses
# END DEF


def getTimes(dataset):
    congruent = dataset[((dataset.primechord == POSITIVESOUND) & (dataset.stimuliWord.isin(POSITIVEWORDS))) | ((dataset.primechord == NEGATIVESOUND) & (dataset.stimuliWord.isin(NEGATIVEWORDS)))]
    incongruent = dataset[((dataset.primechord == POSITIVESOUND) & (dataset.stimuliWord.isin(NEGATIVEWORDS))) | ((dataset.primechord == NEGATIVESOUND) & (dataset.stimuliWord.isin(POSITIVEWORDS)))]
    return (congruent["Reaction Time"].tolist(), incongruent["Reaction Time"].tolist())
# END DEF


def getTestTimes(dataset):
    positive = dataset[(dataset.stimuliWord.isin(POSITIVEWORDS))]
    negative = dataset[(dataset.stimuliWord.isin(NEGATIVEWORDS))]
    return (positive["Reaction Time"].tolist(), negative["Reaction Time"].tolist())
# END DEF


def filteredMean(list1):
    stdWindow = 2

    oldAve = np.mean(list1)
    std = np.std(list1)
    for item in list1:
        if item > oldAve+(stdWindow*std) or item < oldAve-(stdWindow*std):
            # print("removed", oldAve+(2*std), item)
            list1.remove(item)
        # END IF
    # END FOR

    return np.mean(list1)
# END DEF


def toPandas(timesList):
    beforeCon = []
    beforeIncon = []
    afterCon = []
    afterIncon = []

    for participant in timesList:
        meanList = [filteredMean(participant[0][0]), filteredMean(participant[0][1]), filteredMean(participant[1][0]), filteredMean(participant[1][1])]
        combinedMean = np.mean(meanList)
        beforeCon.append(meanList[0]-combinedMean)
        beforeIncon.append(meanList[1]-combinedMean)
        afterCon.append(meanList[2]-combinedMean)
        afterIncon.append(meanList[3]-combinedMean)
    # END FOR

    # for participant in timesList:
    #     meanList = [filteredMean(participant[0][0]), filteredMean(participant[0][1]), filteredMean(participant[1][0]), filteredMean(participant[1][1])]
    #     beforeCon.append(meanList[0])
    #     beforeIncon.append(meanList[1])
    #     afterCon.append(meanList[2])
    #     afterIncon.append(meanList[3])
    # # END FOR

    # initialize data of lists.
    congruent = {"participant": range(1, len(beforeCon)+1),
        'before': beforeCon,
        'after': afterCon
    }
    
    # Create DataFrame
    congruentData = pd.DataFrame(congruent)

    incongruent = {"participant": range(1, len(beforeCon)+1),
        'before': beforeIncon,
        'after': afterIncon
    }
    
    # Create DataFrame
    incongruentData = pd.DataFrame(incongruent)

    conMelt = melt(congruentData)
    inconMelt = melt(incongruentData)

    return conMelt, inconMelt
# END DEF


def melt(df):
    df_melt = pd.melt(df.reset_index(), id_vars=['participant'], value_vars=['before', 'after'])
    df_melt.columns = ["participant", "time", "reactionTime"]

    return df_melt
# END DEF


def combine(df1, df2):
    df1['test'] = ["congruent"]*len(df1)
    df2['test'] = ["incongruent"]*len(df2)
    
    combined = pd.concat([df1, df2])

    return combined
# END DEF


# ================================== plots


def plot(df):
    ax = sns.boxplot(x='time', y='reactionTime', data=df)
    ax = sns.swarmplot(x='time', y='reactionTime', data=df)
    plt.show()
# END DEF


def combinedPlot(combined, plot=1):
    if plot == 1:
        ax = sns.boxplot(x='test', y='reactionTime', hue='time', data=combined)
    else:
        ax = sns.boxplot(x='time', y='reactionTime', hue='test', data=combined)
    plt.show()
# END DEF


# ================================ stats tests


def post_hoc(df):
    groups = ["BC"] * 11 + ["AC"] * 11 + ["BI"] * 11 + ["AI"] * 11

    df["group"] = groups
    
    tukey = pairwise_tukeyhsd(endog=df['reactionTime'], groups=df['group'], alpha=0.05)
    # print(tukey)

    return tukey
# END DEF


# ========== main ==========

numParticipants = 11

timesList = testMultiple(range(1, numParticipants+1))

conData, inconData = toPandas(timesList)


combined = combine(conData, inconData)

print(combined)


# #perform three-way ANOVA
# model = ols("""reactionTime ~ C(time) + C(test) + C(time):C(test)""", data=combined).fit()

# anova = sm.stats.anova_lm(model, typ=2)

# tukey = post_hoc(combined)


# print("========== anova ==========")
# print(anova)
# print("========== tukey ==========")
# print(tukey)


# combinedPlot(combined, 2)

finalTimeList = combined["reactionTime"].tolist()
BC = finalTimeList[:11]
AC = finalTimeList[11:22]
BI = finalTimeList[22:33]
AI = finalTimeList[33:]

print(np.mean(BC))
print(np.mean(BI))
print(np.mean(AC))
print(np.mean(AI))