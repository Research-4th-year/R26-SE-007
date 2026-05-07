from sklearn.linear_model import LinearRegression

class FLClient:

    def __init__(self, X, y):
        self.X = X
        self.y = y

    def train(self):

        model = LinearRegression()

        model.fit(self.X, self.y)

        weights = model.coef_
        bias = model.intercept_

        return weights, bias